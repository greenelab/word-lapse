#!/usr/bin/env python

import logging
import os
import sys
import redis

from rq import Connection, Worker

from .config import CORPORA_SET, MATERIALIZE_MODELS, WARM_CACHE, DEBUG
from .neighbors import (
    cutoff_points,
    extract_frequencies,
    extract_neighbors,
    materialized_word_models,
    get_concept_id_mapper
)
from .tracking import ExecTimer

logging.basicConfig(stream=sys.stdout)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def get_neighbors(tok: str, corpus: str):
    with ExecTimer() as timer:
        # Extract the frequencies
        frequency_output = extract_frequencies(tok)
        logger.info("finished extract_frequencies()...")

        # Extract Estimated Cutoff Points
        changepoint_output = cutoff_points(tok)
        logger.info("finished cutoff_points()...")

        # Extract the neighbors
        word_neighbor_map = extract_neighbors(tok, corpus=corpus)
        logger.info("finished word_neighbor_map()...")

        # Final Return Object
        # DN: This object doesn't contain the umap plot needed for visualization.
        # On my todolist of things to get done.

        return {
            "neighbors": word_neighbor_map,
            "frequency": frequency_output,
            "changepoints": changepoint_output,
            "elapsed": timer.snapshot(),
        }

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
        for corpus in CORPORA_SET:
            logger.info("Materializing '%s' corpus" % corpus)
            materialized_word_models(corpus=corpus)

    queues = sys.argv[1:] or ["default"]

    with Connection(redis.from_url(os.environ.get("REDIS_URL"))):
        w = Worker(queues)
        w.work()
