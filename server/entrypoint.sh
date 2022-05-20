#!/bin/bash

function dir_is_empty {
    [ -n "$(find "$1" -maxdepth 0 -type d -empty 2>/dev/null)" ]
}

# enable reloading if DEBUG is 1
[[ ${DEBUG:-0} -eq 1 ]] && DO_RELOAD="--reload" || DO_RELOAD=""

# enables renewing the certificate via certbot
# if disabled, whatever certificate (if there is one) will be used
RENEW_OR_OBTAIN_CERT="${RENEW_OR_OBTAIN_CERT:-1}"

# set the hostname, or use a default value if unspecified
DNS_NAME="${DNS_NAME:-api-wl.greenelab.com}"

# if 1, updates ddns using the env vars NOIP_DDNS_USERNAME and NOIP_DDNS_PASSWORD
UPDATE_DDNS=${UPDATE_DDNS:-0}

# enable inline redis (i.e., as a forked process), if USE_INLINE_REDIS is 1
if [ ${USE_INLINE_REDIS:-0} -eq 1 ]; then
    echo "* Booting redis-server..."
    # fork off a redis process and override REDIS_URL to use this local one
    redis-server /redis/redis.conf --save 60 1 --loglevel warning \
        >  /var/log/redis.stdout \
        2> /var/log/redis.stderr &
    
    export REDIS_URL="redis://localhost:6379"

    # despite redis being backgrounded, it can take some time to come up
    # when its database is large; let's poll until it's ready
    TRIES=30
    for ((i=TRIES;i>0;i--)); do
        if redis-cli ping; then
            break
        fi
        echo "* redis-server not yet up, retrying... (retries left: $i)"
    done
fi

# read in RQ_CONCURRENCY, or set to 1 process if unspecified
# export it so the API can tell us what it's set to, too
export RQ_CONCURRENCY=${RQ_CONCURRENCY:-1}

# enable inline rq (a task queue), if USE_INLINE_RQ is 1
if [ ${USE_INLINE_RQ:-0} -eq 1 ]; then
    mkdir -p /var/log/w2v_worker/

    # test if entr could work
    entr -r 'echo hi' > /dev/null 2>&1
    ENTR_CODE=$?

    if [[ ${ENTR_CODE} -ne 0 ]]; then
        echo " * ERROR: entr test failed (code ${ENTR_CODE}), skipping auto-reload"
    fi

    if [[ ${ENTR_CODE} -eq 0 ]] && [[ ${DEBUG:-0} -eq 1 ]] && [[ ${NO_WORKER_RELOAD:-0} -ne 1 ]]; then
        echo "* RQ: debug enabled, enabling autoreloading"
        export ENTR_INOTIFY_WORKAROUND=0
        
        ( find ./backend | entr -r ./_boot_workers.sh ) &
    else
        # just boot them normally
        # FIXME: find a way to not repeat this block
        #  (functions don't work w/entr, sadly...)
        ./_boot_workers.sh &
    fi
fi

# time before gunicorn decides a worker is "dead"
GUNICORN_TIMEOUT=${GUNICORN_TIMEOUT:-600}

# if /app/data is populated, attempt a git lfs pull
# if it's not, clone word-lapse-models into it and then pull
if [ "${UPDATE_DATA:-1}" = "1" ]; then
    DATA_DIR=/app/data/

    # squelch hostname checks about github.com
    mkdir -p ~/.ssh && ssh-keyscan -t rsa github.com > ~/.ssh/known_hosts

    # ensure DATA_DIR exists
    mkdir -p "${DATA_DIR}"

    if dir_is_empty "${DATA_DIR}"; then
        # the folder is empty
        # clone submodule into ./data and do an lfs pull
        echo "* ${DATA_DIR} is empty, cloning data into it"
        git clone 'https://github.com/greenelab/word-lapse-models.git' "${DATA_DIR}"
        cd "${DATA_DIR}" && git pull --ff-only
    else
        # just attempt to pull new data into the existing folder
        echo "* ${DATA_DIR} is *not* empty, refreshing contents"
        cd "${DATA_DIR}" && git pull --ff-only
    fi
fi

# # FIXME: right now i don't know how to get secrets, but once we do we can enable this
# if [ "${UPDATE_DDNS}" = "1" ]; then
#     # FIXME: attempt to acquire secrets
#     if [[ ! -z "${NOIP_DDNS_USERNAME}" ]] && [[ ! -z "${NOIP_DDNS_PASSWORD}" ]]; then
#         EXTERNAL_IP=$( curl -H "Metadata-Flavor: Google" http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip )
#         curl "http://${NOIP_DDNS_USERNAME}:${NOIP_DDNS_PASSWORD}@dynupdate.no-ip.com/nic/update?hostname=${DNS_NAME}&myip=${EXTERNAL_IP}"
#     else
#         echo "* Warning: UPDATE_DDNS was ${UPDATE_DDNS}, but NOIP_DDNS_USERNAME/PASSWORD were unset!"
#     fi
# fi

if [ "${USE_HTTPS:-1}" = "1" ]; then
    # check if our certificate needs to be created (e.g., if it's missing)
    # or if we just need to renew
    if [ "${RENEW_OR_OBTAIN_CERT:-1}" = "1" ]; then
        if dir_is_empty /etc/letsencrypt/ || [[ ! -d /etc/letsencrypt/live/${DNS_NAME}/ ]]; then
            certbot certonly \
                --non-interactive --standalone --agree-tos \
                -m "${ADMIN_EMAIL:-faisal.alquaddoomi@cuanschutz.edu}" \
                -d "${DNS_NAME}"
        else
            # most of the time this is a no-op, since it won't renew if it's not near expiring
            certbot renew
        fi
    fi

    # finally, run the server (with HTTPS)
    cd /app

    if [[ ${USE_UVICORN:-1} -eq 1 ]]; then
        echo "* Booting uvicorn..."
        /usr/local/bin/uvicorn backend.main:app --host 0.0.0.0 --port 443 ${DO_RELOAD} \
            --ssl-keyfile=/etc/letsencrypt/live/${DNS_NAME}/privkey.pem \
            --ssl-certfile=/etc/letsencrypt/live/${DNS_NAME}/fullchain.pem
    else
        echo "* Booting gunicorn w/${WEB_CONCURRENCY:-4} workers..."
        gunicorn backend.main:app --bind 0.0.0.0:443 ${DO_RELOAD} \
            --timeout ${GUNICORN_TIMEOUT} \
            --workers ${WEB_CONCURRENCY:-4} --worker-class uvicorn.workers.UvicornWorker \
            --keyfile=/etc/letsencrypt/live/${DNS_NAME}/privkey.pem \
            --certfile=/etc/letsencrypt/live/${DNS_NAME}/fullchain.pem
    fi
else
    # finally, run the server (with just HTTP)
    cd /app

    if [[ ${USE_UVICORN:-1} -eq 1 ]]; then
        echo "* Booting uvicorn..."
        /usr/local/bin/uvicorn backend.main:app --host 0.0.0.0 --port 80 ${DO_RELOAD}
    else
        echo "* Booting gunicorn w/${WEB_CONCURRENCY:-4} workers..."
        gunicorn backend.main:app --bind 0.0.0.0:80 ${DO_RELOAD} \
            --timeout ${GUNICORN_TIMEOUT} \
            --workers ${WEB_CONCURRENCY:-4} --worker-class uvicorn.workers.UvicornWorker 
    fi
fi
