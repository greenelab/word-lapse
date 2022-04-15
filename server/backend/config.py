import os


def is_truthy(v):
    """
    Returns True if v is a true-like value, or False otherwise.

    >>> is_truthy(True)
    True
    >>> is_truthy("True")
    True
    >>> is_truthy("true")
    True
    >>> is_truthy("Yes")
    True
    >>> is_truthy("y")
    True
    >>> is_truthy(None)
    False
    >>> is_truthy(False)
    False
    >>> is_truthy("False")
    False
    >>> is_truthy("n")
    False
    >>> is_truthy("literally anything else")
    False
    """
    return (isinstance(v, bool) and bool(v)) or (
        isinstance(v, str) and v.lower() in ("1", "yes", "y", "true", "t")
    )


# when DEBUG is true, uvicorn will run in debug mode with autoreload enabled
DEBUG = is_truthy(os.environ.get("DEBUG", False))

# when not in debug, sets the loglevel to this value if specified
LOG_LEVEL = os.environ.get("LOG_LEVEL")

# the set of corpora in the data folder
CORPORA_SET = {
    "pubtator": "PMC Full Text",
    # "preprints"
}

# if env var USE_MEMMAP is truthy, loads word2vec models using the mmap='r' flag,
# which largely keeps them on disk and keeps a single copy when sharing between
# processes
USE_MEMMAP = is_truthy(os.environ.get("USE_MEMMAP", True))

# if env var MATERIALIZE_MODELS is truthy, load the models into memory once
# (this requires a pretty big instance, as we're looking at ~20GB of RAM)
MATERIALIZE_MODELS = is_truthy(os.environ.get("MATERIALIZE_MODELS", True))

# if WARM_CACHE is truthy, warms the model cache when this module is first imported
# (requires that MATERIALIZE_MODELS is true, since otherwise there's no cache to warm)
WARM_CACHE = MATERIALIZE_MODELS and is_truthy(os.environ.get("WARM_CACHE", True))

# if PARALLELIZE_QUERY is truthy or unspecified, queries year models in parallel
PARALLELIZE_QUERY = is_truthy(os.environ.get("PARALLELIZE_QUERY", False))
# integer number of pools to use for parallel year queries, default 4
PARALLEL_POOLS = int(os.environ.get("PARALLEL_POOLS", 4))

# controls what backend joblib uses to start parallel jobs
# options are listed here: https://joblib.readthedocs.io/en/latest/generated/joblib.Parallel.html
PARALLEL_BACKEND = os.environ.get("PARALLEL_BACKEND", "loky")

# number of rq workers available, read from the environment
RQ_CONCURRENCY = int(os.environ.get("RQ_CONCURRENCY", -1))


def get_config_values():
    return {
        "DEBUG": DEBUG,
        "CORPORA_SET": CORPORA_SET,
        "USE_MEMMAP": USE_MEMMAP,
        "MATERIALIZE_MODELS": MATERIALIZE_MODELS,
        "WARM_CACHE": WARM_CACHE,
        "PARALLELIZE_QUERY": PARALLELIZE_QUERY,
        "PARALLEL_POOLS": PARALLEL_POOLS,
        "PARALLEL_BACKEND": PARALLEL_BACKEND,
        "RQ_CONCURRENCY": RQ_CONCURRENCY,
    }


def emit_config():
    print("Debug enabled (DEBUG)?: %s" % DEBUG, flush=True)
    print("Corpora set: %s" % CORPORA_SET, flush=True)
    print("Memory-mapped models (USE_MEMMAP)?: %s" % USE_MEMMAP, flush=True)
    print(
        "Materialized models (MATERIALIZE_MODELS)?: %s" % MATERIALIZE_MODELS, flush=True
    )
    print("Pre-warmed model cache (WARM_CACHE)?: %s" % WARM_CACHE, flush=True)
    print(
        "Parallel year querying (PARALLELIZE_QUERY)?: %s" % PARALLELIZE_QUERY,
        flush=True,
    )
    print("Parallel pools (PARALLEL_POOLS)?: %s" % PARALLEL_POOLS, flush=True)
    print(
        "Joblib.Parallel backend (PARALLEL_BACKEND)?: %s" % PARALLEL_BACKEND, flush=True
    )


if __name__ == "__main__":
    import doctest

    doctest.testmod()
