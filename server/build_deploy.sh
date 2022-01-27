#!/usr/bin/env bash

SHORT_SHA=$(git log -1 --format=%h)
COMMIT_SHA=$(git log -1 --format=%H)

BUILDS_SKIPPED=${SKIP_BUILD:-0}
DEPLOY_SKIPPED=${SKIP_DEPLOY:-0}

if [ ${BUILD_LOCAL:-0} -eq 1 ]; then
    echo "Executing local build..."
    docker build \
        --platform linux/amd64 \
        -t gcr.io/word-lapse/word-lapse-api-image:${COMMIT_SHA} \
        --build-arg SHORT_SHA=${SHORT_SHA} \
        --build-arg COMMIT_SHA=${COMMIT_SHA} \
        .
    docker push gcr.io/word-lapse/word-lapse-api-image:${COMMIT_SHA}
else
    # farm it off to gcloud build and deploy to the vm
    echo "Executing remote build on gcloud..."

    (
        [[ "$BUILDS_SKIPPED" == "1" ]] && echo "skipping remote build..." || \
        gcloud builds submit --project=word-lapse --timeout=2h30m \
            . --tag gcr.io/word-lapse/word-lapse-api-image:${COMMIT_SHA}
    ) && (
        [[ "$DEPLOY_SKIPPED" == "1" ]] && echo "skipping deploy..." || \
        gcloud compute instances update-container --project=word-lapse word-lapse-api \
            --container-image gcr.io/word-lapse/word-lapse-api-image:${COMMIT_SHA} \
            --container-mount-host-path=mount-path=/app/data,host-path=/mnt/stateful_partition/word-lapse-data,mode=rw \
            --container-mount-host-path=mount-path=/etc/letsencrypt,host-path=/var/letsencrypt,mode=rw
    )
fi
