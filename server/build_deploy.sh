#!/usr/bin/env bash

SHORT_SHA=$(git log -1 --format=%h)
COMMIT_SHA=$(git log -1 --format=%H)

TARGET_INSTANCE="${TARGET_INSTANCE:-word-lapse-api}"
BETA_INSTANCE="${BETA_INSTANCE:-word-lapse-api-beta}"

DEPLOY_BETA=${DEPLOY_BETA:-0}

SKIP_BUILD=${SKIP_BUILD:-0}
SKIP_DEPLOY=${SKIP_DEPLOY:-0}

BASE_IMAGE="gcr.io/word-lapse/word-lapse-api-image"
IMAGE_WITH_TAG="${BASE_IMAGE}:${COMMIT_SHA}"

if [ ${BUILD_LOCAL:-0} -eq 1 ]; then
    echo "Executing local build..."
    docker build \
        --platform linux/amd64 \
        -t ${IMAGE_WITH_TAG} \
        --build-arg SHORT_SHA=${SHORT_SHA} \
        --build-arg COMMIT_SHA=${COMMIT_SHA} \
        .
    docker push ${IMAGE_WITH_TAG}
else
    # farm it off to gcloud build and deploy to the vm
    echo "Executing remote build on gcloud..."

    (
        # build it and tag the build both with the commit SHA and as "latest"
        [[ "$SKIP_BUILD" == "1" ]] && echo "skipping remote build..." || \
        gcloud builds submit --project=word-lapse --config=cloudbuild.yaml \
            --substitutions=_SHORT_SHA="${SHORT_SHA}",_COMMIT_SHA="${COMMIT_SHA}" && \
        gcloud container images add-tag  --project=word-lapse --quiet "${IMAGE_WITH_TAG}" "${BASE_IMAGE}:latest"
    ) && (
        [[ "$SKIP_DEPLOY" == "1" ]] && echo "skipping deploy..." || \
        (
            [[ "$DEPLOY_BETA" == "0" ]] && (
                # deployment to production instance
                echo "Deploying to production (${TARGET_INSTANCE})..."
                gcloud compute instances update-container --project=word-lapse "${TARGET_INSTANCE}" \
                    --container-image=${IMAGE_WITH_TAG} \
                    --container-mount-host-path=mount-path=/app/data,host-path=/mnt/stateful_partition/word-lapse-data,mode=rw \
                    --container-mount-host-path=mount-path=/etc/letsencrypt,host-path=/var/letsencrypt,mode=rw \
                    --container-env-file=instance_env
            ) || (
                # deployment to beta instance
                echo "Deploying to beta (${BETA_INSTANCE})..."
                gcloud compute instances update-container --project=word-lapse "${BETA_INSTANCE}" \
                    --container-image=${IMAGE_WITH_TAG} \
                    --container-mount-host-path=mount-path=/app/data,host-path=/mnt/stateful_partition/word-lapse-data,mode=rw \
                    --container-mount-host-path=mount-path=/etc/letsencrypt,host-path=/var/letsencrypt,mode=rw \
                    --container-env-file=instance_env_beta
            )
        )
    )
fi
