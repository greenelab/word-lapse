#!/usr/bin/env bash

TEMPLATE_NAME="word-lapse-worker-medium-preempt"
INSTANCE_GROUP="word-lapse-workers"

PROJECT="word-lapse"
ZONE="us-central1-a"

# clean up existing template
gcloud compute instance-templates delete ${TEMPLATE_NAME}

# create new one
gcloud compute instance-templates create-with-container ${TEMPLATE_NAME} \
    --project=word-lapse \
    --preemptible \
    --machine-type=e2-standard-2 \
    --create-disk=^,@^description=Stores\ just\ the\ word-lapse\ models,\ without\ version\ control\ metadata.,@device-name=word-lapse-models,@image=projects/word-lapse/global/images/word-lapse-models-02-24-2022,@mode=rw,@size=32,@type=pd-ssd,@auto-delete=yes \
    --container-image=gcr.io/word-lapse/word-lapse-api-image:latest \
    --container-restart-policy=on-failure \
    --container-command=/app/entrypoint_worker.sh \
    --container-env=REDIS_URL=redis://10.128.0.7:6379 \
    --container-mount-host-path=host-path=/mnt/disks/word-lapse-models,mode=rw,mount-path=/app/data \
    --image=projects/cos-cloud/global/images/cos-stable-93-16623-102-12 \
    --labels=role=word-lapse-worker,container-vm=cos-stable-93-16623-102-12 \
    --metadata google-logging-enabled=true \
    --metadata-from-file user-data=./cloud-meta

if [[ ${UPDATE_INSTANCE_GROUP:-1} -eq 1 ]]; then
    echo "Updating instance group ${INSTANCE_GROUP}..."
    gcloud compute instance-groups managed set-instance-template ${INSTANCE_GROUP} --template=${TEMPLATE_NAME}
    echo "...done!"
fi

# test connecting to it
if [[ ${TEST_CONNECT:-0} -eq 1  ]]; then
    # function for waiting until instance is up
    # courtesy of https://stackoverflow.com/a/65683139
    function wait_vm_up {
        local counter=0

        local readonly instance=${1:?"instance required"}
        local readonly project=${2:-$PROJECT}
        local readonly zone=${3:-$ZONE}
        local readonly user=${4:-$USER}
        local readonly maxRetry=${5:-100}

        echo "Project: $project"
        echo "Instance: $instance"
        echo "MaxRetry: $maxRetry"

        while true ; do
            if (( $counter == $maxRetry )) ; then
            echo "Reach the retry upper limit $counter"
            exit 1
            fi

            gcloud compute ssh --quiet --zone "$zone" "$instance" --tunnel-through-iap --project "$project" --command="true" 2> /dev/null

            if (( $? == 0 )) ;then
            echo "The machine is UP !!!"
            exit 0
            else
            echo "Maybe later? $counter"
            ((counter++))
            sleep 1
            fi
        done
    }


    TEMP_INSTANCE_NAME="wl-test"

    gcloud compute instances create \
        --source-instance-template=word-lapse-worker-medium-preempt --zone=us-central1-a \
        ${TEMP_INSTANCE_NAME}

    # wait for the instance to exist?
    wait_vm_up ${TEMP_INSTANCE_NAME}
    gcloud compute ssh --zone=us-central1-a ${TEMP_INSTANCE_NAME}

    gcloud compute instances delete --zone=us-central1-a ${TEMP_INSTANCE_NAME}
fi
