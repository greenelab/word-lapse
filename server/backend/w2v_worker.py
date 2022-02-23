#!/usr/bin/env python

import logging
import os
import sys
import redis

from rq import Connection, Worker

from .config import MATERIALIZE_MODELS, WARM_CACHE
from .neighbors import (
    cutoff_points,
    extract_frequencies,
    extract_neighbors,
    materialized_word_models,
)
from .tracking import ExecTimer

logger = logging.getLogger(__name__)


def get_neighbors(tok: str):
    with ExecTimer() as timer:
        # Extract the frequencies
        frequency_output = extract_frequencies(tok)
        logger.info("finished extract_frequencies()...")

        # Extract Estimated Cutoff Points
        changepoint_output = cutoff_points(tok)
        logger.info("finished cutoff_points()...")

        # Extract the neighbors
        word_neighbor_map = extract_neighbors(tok)
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


def ping(response: str):
    return "pong! %s" % response


if __name__ == "__main__":
    if MATERIALIZE_MODELS and WARM_CACHE:
        # invoke to cache word models into 'word_models'
        logger.info("Warming enabled, preloading word2vec models...")
        materialized_word_models()

    queues = sys.argv[1:] or ["default"]

    with Connection(redis.from_url(os.environ.get("REDIS_URL"))):
        w = Worker(queues)
        w.work()
