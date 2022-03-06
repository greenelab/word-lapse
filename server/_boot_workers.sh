#!/usr/bin/env bash

if [ ! -f /.dockerenv ]; then
    echo "ERROR: running outside of docker container, aborting..."
    exit 1
fi

RQ_CONCURRENCY=${RQ_CONCURRENCY:-0}

echo "* Booting ${RQ_CONCURRENCY} rq worker(s)..."
(
    cd /app
    for x in $( seq ${RQ_CONCURRENCY} ); do
        python -m backend.w2v_worker w2v_queries \
            >  /var/log/w2v_worker/${x}_stdout \
            2> /var/log/w2v_worker/${x}_stderr &
        echo " -> ${x} worker booted"
    done
)
