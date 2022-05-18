#!/usr/bin/env bash

UTILS_PYTHON="../.venv/bin/python"
PROJECT="word-lapse"
ZONE="us-central1-a"
INSTANCE_GROUP="word-lapse-workers"
COMMON_ARGS="--project=${PROJECT} ${INSTANCE_GROUP} --zone=${ZONE}"

# nodes to scale up to while we're running
DESIRED_NODES=64

# number of parallel jobs to run
# (less than DESIRED_NODES to maintain some extra capacity for real clients)
DESIRED_JOBS=64

# nodes to keep after we're done
FINAL_NODES=2

function fail_w_msg {
    echo "$1"
    exit 1
}

# --------------------------
# --- startup, execution, cleanup
# --------------------------

# remove the logging file
rm -f non_200s.log

# scale up to the number of nodes we want
echo "Scaling up nodes to ${DESIRED_NODES}..."
gcloud compute instance-groups managed resize ${COMMON_ARGS} ${INSTANCE_GROUP} --size=${DESIRED_NODES} \
    || fail_w_msg "unable to scale instance groups"
gcloud compute instance-groups managed wait-until ${COMMON_ARGS} --stable ${INSTANCE_GROUP}
echo "...done!"

# run the cache populater w/the desired number of jobs
export SERVER_URL="https://api-wl.greenelab.com"
export RQ_CONCURRENCY=${DESIRED_JOBS}

export WORD_LIST=${WORD_LIST}
export CORPUS=${CORPUS:-"pubtator"}

${UTILS_PYTHON} populate_cache.py

# remove all the instances at the end
echo "Scaling down to ${FINAL_NODES}..."
gcloud compute instance-groups managed resize ${COMMON_ARGS} ${INSTANCE_GROUP} --size=${FINAL_NODES}
gcloud compute instance-groups managed wait-until ${COMMON_ARGS} --stable ${INSTANCE_GROUP}
echo "...done!"
