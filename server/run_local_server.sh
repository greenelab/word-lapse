#!/usr/bin/env bash

IMAGE=word-lapse-api
TAG=latest

(
    [[ "${BUILD_IMAGE:-1}" -eq 0 ]] \
        && echo "* Skipping build, using ${IMAGE}:${TAG}" \
        || docker build -t ${IMAGE}:${TAG} .
) && \
    docker run --name word-lapse-api --rm -it \
        -p 8080:80 \
        -v $PWD/data:/app/data \
        -v redis_data:/redis/data \
        -e USE_HTTPS=0 -e UPDATE_DATA=0 \
        -e USE_INLINE_REDIS=1 \
        -e DEBUG=1 \
        --env-file=instance_env \
        ${IMAGE}:${TAG} "$@"
