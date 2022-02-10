import logging
import os
from typing import Optional

from fastapi import FastAPI
from fastapi_redis_cache import FastApiRedisCache, cache

from .neighbors import cutoff_points, extract_frequencies, extract_neighbors
from .tracking import ExecTimer

logger = logging.getLogger(__name__)

app = FastAPI()
redis_cache : FastApiRedisCache = None # populated in init_redis_cache, used in neighbors_is_cached

@app.on_event('startup')
async def check_warm_cache():
    from .config import MATERIALIZE_MODELS, WARM_CACHE, emit_config
    from .neighbors import materialized_word_models

    # print out app_config's settings for debugging
    emit_config()

    if MATERIALIZE_MODELS and WARM_CACHE:
        # invoke to cache word models into 'word_models'
        print("Warming enabled, preloading word2vec models...", flush=True)
        materialized_word_models()

@app.on_event("startup")
def init_redis_cache():
    global redis_cache
    redis_cache = FastApiRedisCache()
    redis_cache.init(
        host_url=os.environ.get("REDIS_URL")
    )

@app.get("/")
async def read_root():
    return {
        "name": "Word Lapse API",
        "commit_sha": os.environ.get("COMMIT_SHA", "unknown")
    }

@app.get("/neighbors")
@cache()
async def neighbors(tok: str):
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
            "elapsed": timer.snapshot()
        }

@app.get("/neighbors/cached")
async def neighbors_is_cached(tok: str):
    key = redis_cache.get_cache_key(neighbors, tok)
    (_, in_cache) = redis_cache.check_cache(key)
    return {
        "token": tok,
        "is_cached": True if in_cache is not None else False
    }
