#!/usr/bin/env bash

# sets a default redis url. if there's an external server you want to use,
# you should definitely specify that with the REDIS_URL env var
export REDIS_URL=${REDIS_URL:-redis://localhost:6379}

# these are read in as worker config
# (we override these so single workers can run efficiently)
export USE_MEMMAP=true
export MATERIALIZE_MODELS=true
export WARM_CACHE=true
# we'll just be using one worker per VM, since disk bandwidth is the limiter it seems
export PARALLELIZE_QUERY=false
# export PARALLEL_POOLS=6
# export PARALLEL_BACKEND=threading

# these are used by the regular entrypoint.sh.
# i kept them here to explain why they're not set
# export USE_INLINE_REDIS=1
# export USE_INLINE_RQ=1
# export RQ_CONCURRENCY=2


cd /app
mkdir -p /var/log/w2v_worker
python -m backend.w2v_worker w2v_queries \
    >  /var/log/w2v_worker/stdout \
    2> /var/log/w2v_worker/stderr
