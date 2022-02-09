import logging
from typing import Optional
from fastapi import FastAPI
from .tracking import ExecTimer

from .neighbors import cutoff_points, extract_frequencies, extract_neighbors


logger = logging.getLogger(__name__)

app = FastAPI()


@app.on_event('startup')
async def check_warm_cache():
    from .config import ( emit_config, MATERIALIZE_MODELS, WARM_CACHE )
    from .neighbors import materialized_word_models
    
    # print out app_config's settings for debugging
    emit_config()

    if MATERIALIZE_MODELS and WARM_CACHE:
        # invoke to cache word models into 'word_models'
        print("Warming enabled, preloading word2vec models...", flush=True)
        materialized_word_models()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/neighbors")
def neighbors(tok: str):
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
