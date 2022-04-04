import asyncio
import logging
import os
import re
from itertools import islice
from functools import wraps

import redis
from fastapi import FastAPI, HTTPException, Request
from fastapi_redis_cache import FastApiRedisCache, cache
from pygtrie import PrefixSet
from rq import Queue, Worker
from rq.exceptions import NoSuchJobError
from rq.job import Job
from starlette.middleware.cors import CORSMiddleware

from .config import CORPORA_SET, DEBUG, LOG_LEVEL, get_config_values
from .config import CORPORA_SET, get_config_values, DEBUG
from .tracking import ExecTimer

logging.basicConfig()
logger = logging.getLogger(__name__)
if DEBUG:
    logger.setLevel(logging.DEBUG)
elif LOG_LEVEL:
    logger.setLevel(logging.getLevelName(LOG_LEVEL))

app = FastAPI()

# populated in init_redis_cache(), used in neighbors_is_cached
redis_cache: FastApiRedisCache = None
# populated in init_rq(), used in neighbors()
queue: Queue = None
# populated in init_autocomplete_trie, used in autocomplete()
trie: PrefixSet = None


# lists all origins that are allowed to hit the API
# (note that this is enforced by the browser, not by the server, so clients that
# don't validate CORS -- curl, etc. -- will still work)
# also, note that both allow_origins and allow_origin_regex are checked.
# first, the origin is checked against the regex and, if it matches, allows
# access. the origin is then checked to see if it's in 'origins' and again,
# if present, allows access.
origins = [
    "https://greenelab.github.io",
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
]
origin_regex = "https://deploy-preview-.*--word-lapse.netlify.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=("DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"),
    allow_headers=["*"],
)

# ========================================================================
# === handlers that run on server boot
# ========================================================================

# @app.on_event('startup')
# async def emit_config():
#     from .config import emit_config
#     emit_config()


@app.on_event("startup")
async def init_redis_cache():
    # initializes redis_cache, a FastAPI-compatible cache decorator.
    # the cached entries are persisted in redis, a fast in-memory store with
    # occasional disk persistence.
    global redis_cache
    redis_cache = FastApiRedisCache()
    redis_cache.init(host_url=os.environ.get("REDIS_URL"), prefix="wlc")


@app.on_event("startup")
async def init_rq():
    # initialize rq, the redis queue.
    # moves expensive tasks to a separate process where they won't block the API
    global queue
    r = redis.from_url(os.environ.get("REDIS_URL"))
    queue = Queue("w2v_queries", connection=r)


@app.on_event("startup")
def init_autocomplete_trie():
    global trie

    with ExecTimer(verbose=True):
        logger.info("Starting trie load...")
        with open("./data/full_vocab.txt", "r") as fp:
            trie = PrefixSet()
            for line in fp:
                trie.add(line)
        logger.info("...trie loading done!")

# ========================================================================
# === helper methods
# ========================================================================


async def wait_on_job(job):
    """
    Polls 'job' until it's done, then returns its result if successful.

    If unsuccessful, throws an HTTPException 500 with details about the job
    exception included in the details.
    """
    try:
        while not job.is_finished:
            await asyncio.sleep(1)
            if job.get_status(refresh=True) == "failed":
                raise Exception("job failed!", job.exc_info)

        return job.result
    except Exception as ex:
        print(ex)
        raise HTTPException(status_code=500, detail="Job process exception: %s" % ex)


async def enqueue_and_wait(func, *args, **kwargs):
    """
    Helper method to pass 'func' with any extra args to the w2v_queries queue.
    """

    return await wait_on_job(queue.enqueue(func, *args, **kwargs))


def lowercase_field(target_field="tok"):
    def decorator(func):
        @wraps(func)
        async def anon(*args, **kwargs):
            if target_field in kwargs:
                kwargs[target_field] = kwargs[target_field].lower()
            return await func(*args, **kwargs)

        return anon

    return decorator


# ========================================================================
# === endpoints
# ========================================================================


@app.get("/")
async def server_meta(worker_details: bool = False, cache_details: bool = True):
    """
    Returns metadata about the server, e.g. config variables, the
    commit that was used to build the server, etc.
    """

    # gather info about worker pools, load, etc.
    r = redis.from_url(os.environ.get("REDIS_URL"))
    runtime = {"total_workers": Worker.count(connection=r)}

    payload = {
        "name": "Word Lapse API",
        "commit_sha": os.environ.get("COMMIT_SHA", "unspecified"),
        "config": get_config_values(),
        "runtime": runtime,
    }

    if worker_details:
        workers = Worker.all(connection=r)
        runtime["worker_info"] = {
            worker.hostname: {
                "state": worker.state,
                "queues": str(worker.queues),
                "current_job": getattr(worker, "current_job", None),
                "successes": worker.successful_job_count,
                "failures": worker.failed_job_count,
            }
            for worker in workers
        }

    if cache_details:
        # prefix = redis_cache.get_cache_key(neighbors, "").split("tok=")[0]
        rq_keys = len(r.keys(f"rq:*"))
        keyspace = r.info("keyspace")
        payload["cache"] = {
            # "entries": len(r.keys(f"{prefix}*")),
            "cached_entries": int(keyspace["db0"]["keys"]) - rq_keys,
            "keyspace": keyspace,
        }

    return payload


@app.get("/ping")
async def ping_workers():
    """
    Sends a ping to a worker, for debugging purposes.
    """
    from .w2v_worker import ping

    return {"result": await enqueue_and_wait(ping, "hello?")}


@app.get("/neighbors")
@lowercase_field()
@cache()
async def neighbors(request: Request, tok: str, corpus: str = 'abstracts'):
    """
    Returns information about the token 'tok' over all the years in the dataset
    specified by 'corpus' (either 'abstracts' or 'fulltext', default 'abstracts').

    Note that this operation can take a long time (1 minute+) if the word is not
    cached. If it's previously been cached and hasn't been evicted, response times
    should be within 1 second.

    The returned object is of the form

    ```
    {
        "neighbors": {<year:str>: [<token:str>, ...]},
        "frequency": [{"year": <year:int>, "frequency": <frequency:float>}, ...],
        "changepoints": [ [<year_start:str>, <year_end:str>], ...],
        "elapsed": <elapsed_ms:float>
    }
    ```

    Notes:
    - `elapsed_ms` is the length of time the request took to formulate on
    the server.
    """
    from .w2v_worker import get_neighbors

    # validate the corpus before we send off a job, since it's hard to read the exception there
    if corpus not in CORPORA_SET:
        logger.info("Corpus %s requested, but not found in %s" % (corpus, CORPORA_SET))
        raise HTTPException(
            status_code=400, detail="Requested corpus '%s' not in corpus set %s" % (corpus, CORPORA_SET)
        )

    logger.info("Serving request for %s..." % tok)

    # construct unique job id
    new_job_id = f"get_neighbors__{corpus}_{tok}"

    try:
        # attempt to fetch and wait on an existing job
        r = redis.from_url(os.environ.get("REDIS_URL"))
        existing_job = Job.fetch(new_job_id, connection=r)

        logger.info("Found existing job! %s" % existing_job)

        if existing_job.get_status() == "failed":
            logger.info("..but job %s has staus failed" % existing_job)
            raise NoSuchJobError()

        return await wait_on_job(existing_job)

    except NoSuchJobError:
        logger.info("Creating new job for %s" % tok)

        # create and fire off a new job
        return await enqueue_and_wait(
            get_neighbors,
            tok=tok, corpus=corpus,
            job_timeout=800,
            job_id=new_job_id,
            result_ttl=10,
            failure_ttl=10,
        )


@app.get("/neighbors/cached")
@lowercase_field()
async def neighbors_is_cached(tok: str, corpus: str = 'abstracts'):
    """
    Queries the cache for 'tok', returning the token in the 'token'
    field and whether it's cached or not in the 'is_cached' field.

    corpus: which corpus to search (one of 'abstracts, 'fulltexts'), default 'abstracts'

    Note that querying for the token will increase its cache count,
    making it less likely to be evicted.
    """
    key = redis_cache.get_cache_key(neighbors, request=None, tok=tok, corpus=corpus)
    (_, in_cache) = redis_cache.check_cache(key)
    return {"token": tok, "is_cached": True if in_cache is not None else False}


@app.get("/neighbors/cache")
async def neighbors_cache(count: int = 100):
    """
    Returns a list of tokens in the cache, with up to 'count' entries returned
    (default 100, max value 1000).

    Note that while these tokens are ordered by the 'freq' field in the list
    that's returned, they're not retrieved in order of 'freq' due to redis'
    limitations and the prohibitive cost of querying and returning all the keys
    to order it ourselves.

    Refer to [redis's LFU documentation](https://redis.io/topics/lru-cache#the-new-lfu-mode)
    for the meaning of the 'freq' field.
    """
    # connect to redis and get the top 100 keys by frequency?
    r = redis.from_url(os.environ.get("REDIS_URL"))

    # clamp count to something reasonable
    actual_count = min(count, 1000)

    prefix = "wlc"

    # extract the token from the key, e.g. "mouse" from "backend.main.neighbors(mouse)"
    tok_extract = re.compile(r".*tok=(?P<token>[^,]+).*?(?:corpus=(?P<corpus>[^)]+))?\)")

    # build a list of top "count" tokens, then order it by frequency
    # (note that if there are more than 'count' tokens, we can't guarantee they're the top ones...)
    toptokens = [
        {
            **{"freq": r.object("freq", x)},
            **(tok_extract.search(x.decode("utf8")).groupdict())
        }
        for x in islice(r.scan_iter(match=("%s*" % prefix), count=actual_count), actual_count)
        if tok_extract.search(x.decode("utf8")) is not None
    ]

    return toptokens


@app.get("/autocomplete")
async def autocomplete(prefix: str, limit: int = 20):
    """
    Produces a list of words with prefix 'prefix' from across the entire corpus.
    Returns up to 'limit' entries (max 100).

    Note that prefixes of length less than three will simply return the prefix.
    """
    global trie

    prefix = prefix.lower()
    limit = min(limit, 100)

    if len(prefix) < 3:
        return [prefix]

    results = ["".join(x).strip() for x in islice(trie.iter(prefix=prefix), limit)]
    return results
