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
    return (
        (isinstance(v, bool) and bool(v)) or
        (isinstance(v, str) and v.lower() in ("yes", "y", "true", "t"))
    )

# if env var MATERIALIZE_MODELS is truthy, load the models into memory once
# (this requires a pretty big instance, as we're looking at ~20GB of RAM)
MATERIALIZE_MODELS = is_truthy(os.environ.get('MATERIALIZE_MODELS', 'yes'))

# if WARM_CACHE is truthy, warms the model cache when this module is first imported
# (requires that MATERIALIZE_MODELS is true, since otherwise there's no cache to warm)
WARM_CACHE = MATERIALIZE_MODELS and is_truthy(os.environ.get('WARM_CACHE', 'yes'))

# if PARALLELIZE_QUERY is truthy or unspecified, queries year models in parallel
PARALLELIZE_QUERY = is_truthy(os.environ.get('PARALLELIZE_QUERY', 'yes'))
# integer number of pools to use for parallel year queries, default 4
PARALLEL_POOLS = int(os.environ.get('PARALLEL_POOLS', 4))

print("Materialized models (MATERIALIZE_MODELS)?: %s" % MATERIALIZE_MODELS, flush=True)
print("Pre-warmed model cache (WARM_CACHE)?: %s" % WARM_CACHE, flush=True)
print("Parallel year querying (PARALLELIZE_QUERY)?: %s" % PARALLELIZE_QUERY, flush=True)
print("Parallel pools (PARALLEL_POOLS)?: %s" % PARALLEL_POOLS, flush=True)

if __name__ == "__main__":
    import doctest
    doctest.testmod()
