import re
from itertools import groupby
from pathlib import Path

import pandas as pd
import plydata as ply
from gensim.models import KeyedVectors, Word2Vec
from joblib import Memory, Parallel, delayed

from .config import (
    USE_MEMMAP, MATERIALIZE_MODELS,
    PARALLEL_POOLS, PARALLELIZE_QUERY, PARALLEL_BACKEND
)
from .tracking import ExecTimer

# the root for the word-lapse-models datafiles
data_folder = Path("./data")

# stores cached word model references; used if MATERIALIZE_MODELS is true
# (pre-populated on server startup if .config.WARM_CACHE is true)
word_models = None


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

def load_word_model(model_path, use_keyedvec=True):
    """
    Loads a single word model located at 'path'.
    """

    if use_keyedvec:
        # loads KeyedVectors (rather than full trainable models),
        # which are memory-mapped so they can be shared across processes.
        # also does a warmup query against the model so the initial
        # delay doesn't occur when a user queries the model for the
        # first time.
        return KeyedVectors.load(str(model_path), mmap='r' if USE_MEMMAP else None)
        # word_model.most_similar('pandemic') # any query will load the model
    else:
        return Word2Vec.load(str(model_path))


def word_models_by_year(only_first=True, use_keyedvec=True, just_reference=False):
    """
    Generates a sequence of Word2Vec word models for each years' models
    in ./data/word2vec_models/*/*model.

    The models are sorted by year, then by index within that year if there
    are multiple models associated with a specific year.

    only_first: if true, only returns the first model for each year
    just_reference: if true, only returns the path to the model file
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
                if not just_reference:
                    print("Loading model %s for year %s..." % (str(word_model_ref), year), flush=True)
                    word_model = load_word_model(str(word_model_ref), use_keyedvec=use_keyedvec)
                else:
                    word_model = str(word_model_ref)
                    
                yield year, idx, word_model

                # if only_first, skip the remaining years in this series
                if only_first:
                    break


def materialized_word_models(**kwargs):
    """
    Loads models all at once and keeps them in memory, returning a dict of the
    models on subsequent requests.

    Specifically, it consumes the word_models_by_year() generator the first time
    it's called, but then materializes and caches the result into the global
    'word_models'.
    """

    global word_models

    if word_models and len(word_models) > 0:
        return word_models

    # materialize the word_models_by_year() generator
    word_models = [ (year, idx, model) for year, idx, model in word_models_by_year(**kwargs) ]

    return word_models


def query_model_for_tok(year, tok, model, word_freq_count_cutoff: int = 30, neighbors: int = 25, use_keyedvec:bool = True):
    print("Querying %s for token '%s'..." % (year, tok), flush=True)

    result = []
    word_vectors = model if use_keyedvec else model.wv

    cutoff_index = min(
        map(
            lambda x: (
                999999 if word_vectors.get_vecattr(x[1], "count") > word_freq_count_cutoff else x[0]
            ),
            enumerate(word_vectors.index_to_key),
        )
    )

    # Check to see if token is in the vocab
    vocab = set(word_vectors.key_to_index.keys())

    if tok in vocab:
        # If it is grab the neighbors
        # Gensim needs to be > 4.0 as they enabled neighbor clipping (remove words from entire vocab)
        word_neighbors = word_vectors.most_similar(
            tok,
            topn=neighbors,
            clip_end=cutoff_index,
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
        with Parallel(
            n_jobs=PARALLEL_POOLS, backend=PARALLEL_BACKEND,
            mmap_mode=('r' if USE_MEMMAP else None)
        ) as parallel:
            result = parallel(
                delayed(
                    lambda year, model: (
                        year, query_model_for_tok(
                            year, tok, model,
                            word_freq_count_cutoff=word_freq_count_cutoff,
                            neighbors=neighbors,
                            use_keyedvec=use_keyedvec
                        )
                    )
                )(year, model)
                for year, _, model in model_loader(use_keyedvec=use_keyedvec)
            )
            word_neighbor_map = dict(result)
    else:
        word_neighbor_map = {}

        for year, _, model in model_loader(use_keyedvec=use_keyedvec):
            word_neighbor_map[year] = query_model_for_tok(
                year, tok, model,
                word_freq_count_cutoff=word_freq_count_cutoff,
                neighbors=neighbors,
                use_keyedvec=use_keyedvec
            )

    return word_neighbor_map
