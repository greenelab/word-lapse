#!/usr/bin/env bash

SNAP_DATE=$( date '+%Y-%m-%d' )
IMAGE_FAMILY="word-lapse-models"

PROJECT=word-lapse
REGION=us-central1
ZONE=us-central1-a
API_VM=${API_VM:-word-lapse-api}

NEW_DISK_NAME="wl-models-${SNAP_DATE}"
DISK_SIZE=${DISK_SIZE:-65GB}

# steps:
# 1. create a disk, attach it to API_VM
gcloud compute disks create ${NEW_DISK_NAME} \
    --project=$PROJECT \
    --type=pd-ssd \
    --labels=type=wl-model \
    --size=${DISK_SIZE} --zone=$ZONE

# sleep for a bit to let things settle
sleep 15

# 2. attach to API_VM
gcloud compute instances attach-disk \
  --project=${PROJECT} --zone=${ZONE} ${API_VM} \
  --disk ${NEW_DISK_NAME} \
  --device-name=${NEW_DISK_NAME}

# 3. format, mount, and populate the new disk on the api server
# path to the device and where it's going to be mounted on the api vm
DEVICE_PATH="/dev/disk/by-id/google-${NEW_DISK_NAME}"
LOCAL_MOUNT_PATH="/mnt/disks/wl-scratch"
# path to the existing data on the api vm
WL_DATA_PATH="/mnt/stateful_partition/word-lapse-data"

gcloud compute ssh ${API_VM} --project=${PROJECT} --zone=$ZONE <<EOF
    sudo mkfs.ext4 -m 0 -E lazy_itable_init=0,lazy_journal_init=0,discard \
        ${DEVICE_PATH}
    sudo mkdir -p ${LOCAL_MOUNT_PATH}
    sudo mount -o discard,defaults \
        ${DEVICE_PATH} \
        ${LOCAL_MOUNT_PATH}
    sudo chmod a+w ${LOCAL_MOUNT_PATH}
    # copy in contents of word-lapse-data
    sudo rsync -av --progress ${WL_DATA_PATH}/* ${LOCAL_MOUNT_PATH}
    # and unmount it
    sudo umount ${LOCAL_MOUNT_PATH}
EOF

# 4. detach the disk
gcloud compute instances detach-disk \
  --project=${PROJECT} --zone=${ZONE} ${API_VM} \
  --disk ${NEW_DISK_NAME}

# 4. create an image from the disk
gcloud compute images create ${NEW_DISK_NAME} \
    --project=${PROJECT} --family=${IMAGE_FAMILY} \
    --source-disk=${NEW_DISK_NAME} --source-disk-zone=${ZONE} \
    --storage-location=${REGION}

# 5. delete the disk
gcloud compute disks delete --quiet \
  --project=${PROJECT} --zone=${ZONE} ${NEW_DISK_NAME}
