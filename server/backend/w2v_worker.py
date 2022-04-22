#!/usr/bin/env python

import logging
import os
import sys

import numpy as np
import umap
import redis

from rq import Connection, Worker

from .config import CORPORA_SET, MATERIALIZE_MODELS, WARM_CACHE, DEBUG
from .neighbors import (
    cutoff_points,
    extract_frequencies,
    extract_neighbors,
    materialized_word_models,
    get_concept_id_mapper,
)
from .tracking import ExecTimer

logging.basicConfig(stream=sys.stdout)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def get_neighbors(tok: str, corpus: str):
    with ExecTimer() as timer:
        # Extract the frequencies
        frequency_output = extract_frequencies(tok, corpus)
        logger.info("finished extract_frequencies()...")

        # Extract Estimated Cutoff Points
        changepoint_output = cutoff_points(tok, corpus)
        logger.info("finished cutoff_points()...")

        # Extract the neighbors
        with ExecTimer(verbose=True):
            word_neighbor_map = extract_neighbors(tok, corpus=corpus)
            logger.info("finished word_neighbor_map()...")

        # Final Return Object

        word_neighbor_map, umap_embeddings = split_and_generate_umap_embeddings(
            word_neighbor_map
        )

        return {
            "neighbors": word_neighbor_map,
            "umap_coords": umap_embeddings,
            "frequency": frequency_output,
            "changepoints": changepoint_output,
            "elapsed": timer.snapshot(),
        }


def split_and_generate_umap_embeddings(word_neighbor_map: dict, neighbors: int = 25):
    """
    This function splits the word neighbor data structure into token neighbors
    and their corresponding umap embeddings.
    input:
        word_neighbor_map - the word neighbor map
        neighbors - the number of neighbors used to generate the neighbor map
    Return:
        filtered word_neighbor_map - the word neighbor map with the corresponding vectors missing
        a list of data points for the frontend to use for generating the umap plot
    """

    word_neighbor_map_returned = dict()
    embeddings_matrix = list()
    tok_label_list = list()

    # Extract the vectors for umap
    for year in word_neighbor_map:
        word_neighbor_map_returned[year] = list()

        for idx, tok_entry in enumerate(word_neighbor_map[year]):
            embeddings_matrix.append(tok_entry["vector"])
            tok_label_list.append((year, tok_entry["token"], tok_entry["is_query"]))

            # Include the neighbors for the object return
            if idx > 0:
                word_neighbor_map_returned[year].append(
                    dict(token=tok_entry["token"], tag_id=tok_entry["tag_id"])
                )

    umap_model = umap.UMAP(
        verbose=True,
        metric="cosine",
        random_state=100,
        low_memory=True,
        n_neighbors=neighbors,
        min_dist=0.99,
        n_epochs=25,
    )

    umap_embeddings = umap_model.fit_transform(np.vstack(embeddings_matrix))

    umap_return_dict = [
        dict(
            year=tok_label[0],
            token=tok_label[1],
            is_query=tok_label[2],
            umap_x_coord=umap_coord[0],
            umap_y_coord=umap_coord[1],
        )
        for tok_label, umap_coord in zip(tok_label_list, umap_embeddings)
    ]

    return word_neighbor_map_returned, umap_return_dict


def load_concept_map():
    with ExecTimer(verbose=True):
        # prepopulates concept_id_mapper_dict before anything requests it
        logger.info("Starting concept mapper load...")
        get_concept_id_mapper()
        logger.info("...concept loading done!")


def ping(response: str):
    return "pong! %s" % response


if __name__ == "__main__":
    logger.info("Worker started up")

    # load the concept map
    load_concept_map()

    # load all the year models
    if MATERIALIZE_MODELS and WARM_CACHE:
        # invoke to cache word models into 'word_models'
        logger.info("Warming enabled, preloading word2vec models...")
        for corpus in CORPORA_SET.keys():
            logger.info("Materializing '%s' corpus" % corpus)
            materialized_word_models(corpus=corpus)

    queues = sys.argv[1:] or ["default"]

    with Connection(redis.from_url(os.environ.get("REDIS_URL"))):
        w = Worker(queues)
        w.work()
