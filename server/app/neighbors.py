import multiprocessing
import re
from itertools import groupby
from pathlib import Path

import pandas as pd
import plydata as ply
from gensim.models import KeyedVectors, Word2Vec

from .config import MATERIALIZE_MODELS, WARM_CACHE, PARALLELIZE_QUERY, PARALLEL_POOLS
from .tracking import ExecTimer

data_folder = Path("./data")


# ========================================================================
# === extract_frequencies(), cutoff_points()
# ========================================================================

def extract_frequencies(tok: str):
    # Extract the frequencies
    frequency_table = pd.read_csv(
        data_folder / Path("all_tok_frequencies.tsv.xz"), sep="\t"
    )
    frequency_table >> ply.slice_rows(5)

    frequency_output_df = (
        frequency_table
        >> ply.query("tok == @tok")
        >> ply.select("year", "frequency")
        >> ply.call(".astype", {"year": int})
    )
    frequency_output_df >> ply.slice_rows(5)

    return frequency_output_df >> ply.call(".to_dict", orient="records")


def cutoff_points(tok: str):
    # Extract Estimated Cutoff Points
    cutoff_points = pd.read_csv(
        data_folder / Path("cusum_changepoint_abstracts.tsv"), sep="\t"
    )
    cutoff_points >> ply.slice_rows(5)

    return (
        cutoff_points
        >> ply.query("tok == @tok")
        >> ply.select("changepoint_idx")
        >> ply.call(".to_dict", orient="records")
    )


# ========================================================================
# === extract_neighbors()
# ========================================================================

def word_models_by_year(only_first=True, use_keyedvec=True):
    """
    Generates a sequence of Word2Vec word models for each years' models
    in ./data/word2vec_models/*/*model.

    The models are sorted by year, then by index within that year if there
    are multiple models associated with a specific year.

    only_first: if true, only returns the first model for each year
    """

    model_suffix = "wordvectors" if use_keyedvec else "model"

    def extract_year(k):
        return re.search(r"(\d+)_(\d).%s" % model_suffix, str(k)).group(1)

    # first, produce a list of word models sorted by year
    # (groupby requires a sorted list, since it accumulates groups linearly)
    word_models = list((data_folder / Path("word2vec_models")).rglob(f"*/*{model_suffix}"))
    word_models_sorted = sorted(
        word_models, key=extract_year
    )

    # group all models for a year into a list
    for year, word_model_refs in groupby(word_models_sorted, key=extract_year):
        # yield each model for the current year in order (e.g., 2000_0, 2000_1)
        # differentiated by idx
        for idx, word_model_ref in enumerate(sorted(word_model_refs)):
            with ExecTimer(verbose=True):
                print("Loading model %s for year %s..." % (str(word_model_ref), year), flush=True)
                
                if use_keyedvec:
                    # loads KeyedVectors (rather than full trainable models),
                    # which are memory-mapped so they can be shared across processes.
                    # also does a warmup query against the model so the initial
                    # delay doesn't occur when a user queries the model for the
                    # first time.
                    word_model = KeyedVectors.load(str(word_model_ref), mmap='r')
                    # word_model.most_similar('pandemic') # any query will load the model
                else:
                    word_model = Word2Vec.load(str(word_model_ref))

                yield year, idx, word_model

                # if only_first, skip the remaining years in this series
                if only_first:
                    break

def query_model_for_tok(tok, model, word_freq_count_cutoff: int = 30, neighbors: int = 25, use_keyedvec:bool = True):
    result = []
    word_vectors = model if use_keyedvec else model.wv

    word_model_cutoff = {
        "model": word_vectors,
        "cutoff_index": min(
            map(
                lambda x: (
                    999999 if word_vectors.get_vecattr(x[1], "count") > word_freq_count_cutoff else x[0]
                ),
                enumerate(word_vectors.index_to_key),
            )
        ),
    }

    # Check to see if token is in the vocab
    vocab = set(word_model_cutoff["model"].key_to_index.keys())

    if tok in vocab:
        # If it is grab the neighbors
        # Gensim needs to be > 4.0 as they enabled neighbor clipping (remove words from entire vocab)
        word_neighbors = word_model_cutoff["model"].most_similar(
            tok,
            topn=neighbors,
            clip_end=word_model_cutoff["cutoff_index"],
        )

        # Append neighbor to word_neighbor_map
        for neighbor in word_neighbors:
            result.append(neighbor[0])

    return result

def extract_neighbors(tok: str, word_freq_count_cutoff: int = 30, neighbors: int = 25, use_keyedvec:bool = True):
    """
    Given a word 'tok', for each year from 2000 to 2020, extracts the top
    'neighbors' entries that occur less than 'word_freq_count_cutoff' times
    in that year.

    If use_keyedvec is True, uses Gensim's more efficient, but untrainable
    KeyedVectors implementation, loading files that end in 'wordvectors'.
    If use_keyedvec is False, uses regular Word2Vec instances, loading files
    that end in 'model' and refers to the 'wv' subkey of each instance to
    perform the nearest-neighbor queries.

    Returns a dict of the following form: {<year>: [<neighboring word>, ...], ...}
    """

    model_loader = materialized_word_models if MATERIALIZE_MODELS else word_models_by_year

    if PARALLELIZE_QUERY:
        global pool
        if not pool:
            pool = multiprocessing.Pool(PARALLEL_POOLS)

        word_neighbor_map = dict(
            pool.starmap(
                _query_model,
                (
                    (year, idx, model, tok, word_freq_count_cutoff, neighbors, use_keyedvec)
                    for year, idx, model in model_loader(use_keyedvec=use_keyedvec)
                )
            )
        )
    else:
        word_neighbor_map = {}

        for year, _, model in model_loader(use_keyedvec=use_keyedvec):
            word_neighbor_map[year] = query_model_for_tok(
                tok, model,
                word_freq_count_cutoff=word_freq_count_cutoff,
                neighbors=neighbors,
                use_keyedvec=use_keyedvec
            )

    return word_neighbor_map


# ========================================================================
# === word2vec model materializaton, multiprocessing stubs
# ========================================================================

word_models = None
pool = None # pool of multiprocessing cores; only used if PARALLELIZE_QUERY is true

def materialized_word_models(**kwargs):
    """
    Loads models all at once and keeps them in memory, returning
    a dict of the models on subsequent requests.
    """

    global word_models

    if word_models and len(word_models) > 0:
        return word_models

    # materialize the word_models_by_year() generator
    word_models = [
        (year, idx, model)
        for year, idx, model in word_models_by_year(**kwargs)
    ]

    return word_models

if MATERIALIZE_MODELS and WARM_CACHE:
    # invoke to cache word models into 'word_models'
    print("Warming enabled, preloading word2vec models...", flush=True)
    materialized_word_models()

def _query_model(year, _, model, tok, word_freq_count_cutoff, neighbors, use_keyedvec):
    """"
    Returns a (year, result) tuple that can be combined for multiple years
    into a dict.

    Used by the multiprocessing code to parallelize year searches.
    """
    print("Querying %s for token %s..." % (year, tok), flush=True)

    return (
        year,
        query_model_for_tok(
            tok, model,
            word_freq_count_cutoff=word_freq_count_cutoff,
            neighbors=neighbors,
            use_keyedvec=use_keyedvec
        )
    )
