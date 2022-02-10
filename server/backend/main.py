import asyncio
import logging
import os
from typing import Optional

import redis
from fastapi import FastAPI, HTTPException
from fastapi_redis_cache import FastApiRedisCache, cache
from rq import Queue, Worker

from .config import get_config_values
from .neighbors import cutoff_points, extract_frequencies, extract_neighbors
from .tracking import ExecTimer

logger = logging.getLogger(__name__)

app = FastAPI()

# populated in init_redis_cache(), used in neighbors_is_cached
redis_cache : FastApiRedisCache = None 
# populated in init_rq(), used in neighbors()
queue : Queue = None

# @app.on_event('startup')
# async def emit_config():
#     from .config import emit_config
#     emit_config()

@app.on_event("startup")
async def init_redis_cache():
    global redis_cache
    redis_cache = FastApiRedisCache()
    redis_cache.init(
        host_url=os.environ.get("REDIS_URL")
    )

@app.on_event("startup")
async def init_rq():
    global queue
    r = redis.from_url(os.environ.get("REDIS_URL"))
    queue = Queue('w2v_queries', connection=r)

async def enqueue_and_wait(func, *args, **kwargs):
    """
    Helper method to pass 'func' with any extra args
    to the w2v_queries queue.
    """
    job = queue.enqueue(func, *args, **kwargs)

    try:
        while not job.is_finished:
            await asyncio.sleep(1)
            if job.get_status(refresh=True) == 'failed':
                raise Exception("job failed!", job.exc_info)

        return job.result
    except Exception as ex:
        raise HTTPException(
            status_code=500, detail="Job process exception: %s" % ex
        )


@app.get("/")
async def read_root():
    return {
        "name": "Word Lapse API",
        "commit_sha": os.environ.get("COMMIT_SHA", "unspecified"),
        "config": get_config_values()
    }

@app.get("/ping")
async def ping_workers():
    from .w2v_worker import ping
    return {
        'result': await enqueue_and_wait(ping, 'hello?')
    }

@app.get("/neighbors")
@cache()
async def neighbors(tok: str):
    from .w2v_worker import get_neighbors
    return await enqueue_and_wait(get_neighbors, tok=tok, job_timeout=800)

@app.get("/neighbors/cached")
async def neighbors_is_cached(tok: str):
    key = redis_cache.get_cache_key(neighbors, tok)
    (_, in_cache) = redis_cache.check_cache(key)
    return {
        "token": tok,
        "is_cached": True if in_cache is not None else False
    }
