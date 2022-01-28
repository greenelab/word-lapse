from pathlib import Path
import re

from gensim.models import Word2Vec
import pandas as pd
import plydata as ply

data_folder = Path("./data")


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


def extract_neighbors(tok: str, word_freq_count_cutoff: int = 30, neighbors: int = 25):
    word_models = list((data_folder / Path("word2vec_models")).rglob("*/*model"))

    word_model_map = dict()
    for word_model in word_models:
        match_obj = re.search(r"(\d+)_(\d).model", str(word_model))

        year = int(match_obj.group(1))
        if year not in word_model_map:
            word_model_map[year] = list()

        word_model_map[year].append(str(word_model))

    word_model_loaded_map = {
        key: Word2Vec.load(sorted(word_model_map[key])[0]) for key in word_model_map
    }

    word_model_cutoff_map = {
        key: {
            "model": word_model_loaded_map[key],
            "cutoff_index": min(
                map(
                    lambda x: 999999
                    if word_model_loaded_map[key].wv.get_vecattr(x[1], "count") > word_freq_count_cutoff
                    else x[0],
                    enumerate(word_model_loaded_map[key].wv.index_to_key),
                )
            ),
        }
        for key in word_model_loaded_map
    }

    word_neighbor_map = dict()
    for year in word_model_cutoff_map:
        # Check to see if token is in the vocab
        vocab = list(word_model_cutoff_map[year]["model"].wv.key_to_index.keys())

        if tok in vocab:
            # If it is grab the neighbors
            # Gensim needs to be > 4.0 as they enabled neighbor clipping (remove words from entire vocab)
            word_neighbors = word_model_cutoff_map[year]["model"].wv.most_similar(
                tok,
                topn=neighbors,
                clip_end=word_model_cutoff_map[year]["cutoff_index"],
            )

            # Append neighbor to word_neighbor_map
            for neighbor in word_neighbors:
                if year not in word_neighbor_map:
                    word_neighbor_map[year] = list()

                word_neighbor_map[year].append(neighbor[0])

    return word_neighbor_map
