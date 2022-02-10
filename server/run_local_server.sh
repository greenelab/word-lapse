#!/usr/bin/env bash

SHORT_SHA=$(git log -1 --format=%h)
COMMIT_SHA=$(git log -1 --format=%H)

IMAGE=gcr.io/word-lapse/word-lapse-api-image
TAG=$COMMIT_SHA

(
    [[ "${BUILD_IMAGE:-1}" -eq 0 ]] \
        && echo "* Skipping build, using ${IMAGE}:${TAG}" \
        || docker build \
            --platform linux/amd64 \
            -t ${IMAGE}:${TAG} \
            --build-arg SHORT_SHA=${SHORT_SHA} \
            --build-arg COMMIT_SHA=${COMMIT_SHA} \
            .
) && \
    docker run --name word-lapse-api --rm -it \
        -p 8080:80 \
        -v $PWD:/app \
        -v $PWD/data:/app/data \
        -v redis_data:/redis/data \
        -e USE_HTTPS=0 -e UPDATE_DATA=0 \
        -e USE_INLINE_REDIS=1 \
        -e DEBUG=1 \
        --env-file=instance_env \
        ${IMAGE}:${TAG} "$@"
