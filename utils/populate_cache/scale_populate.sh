#!/usr/bin/env bash

UTILS_PYTHON="../.venv/bin/python"
INSTANCE_GROUP="word-lapse-workers"

# nodes to scale up to while we're running
DESIRED_NODES=32

# number of parallel jobs to run
# (less than DESIRED_NODES to maintain some extra capacity for real clients)
DESIRED_JOBS=31

# nodes to keep after we're done
FINAL_NODES=1

# --------------------------
# --- startup, execution, cleanup
# --------------------------

# remove the logging file
rm -f non_200s.log

# scale up to the number of nodes we want
echo "Scaling up nodes to ${DESIRED_NODES}..."
gcloud compute instance-groups managed resize ${INSTANCE_GROUP}  --project=word-lapse --zone=us-central1-a --size=${DESIRED_NODES}
gcloud compute instance-groups managed wait-until --project=word-lapse --zone=us-central1-a --stable ${INSTANCE_GROUP}
echo "...done!"

# run the cache populater w/the desired number of jobs
export SERVER_URL="https://api-wl.greenelab.com"
export RQ_CONCURRENCY=${DESIRED_JOBS}

${UTILS_PYTHON} populate_cache.py

# remove all the instances at the end
echo "Scaling down to ${FINAL_NODES}..."
gcloud compute instance-groups managed resize ${INSTANCE_GROUP} --zone=us-central1-a --size=${FINAL_NODES}
gcloud compute instance-groups managed wait-until --stable ${INSTANCE_GROUP}
echo "...done!"
