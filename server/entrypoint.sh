#!/bin/bash

function dir_is_empty {
    [ -n "$(find "$1" -maxdepth 0 -type d -empty 2>/dev/null)" ]
}

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
        cd /app/data && git lfs pull
    else
        # just attempt to pull new data into the existing folder
        echo "* ${DATA_DIR} is *not* empty, refreshing contents"
        cd /app/data && git lfs pull
    fi
fi

if [ "${USE_HTTPS:-1}" = "1" ]; then
    # check if our certificate needs to be created (e.g., if it's missing)
    # or if we just need to renew
    if dir_is_empty /etc/letsencrypt/; then
        certbot certonly \
            --non-interactive --standalone --agree-tos \
            -m "${ADMIN_EMAIL:-faisal.alquaddoomi@cuanschutz.edu}" \
            -d "${DNS_NAME:-api-wl.greenelab.com}"
    else
        # most of the time this is a no-op, since it won't renew if it's not near expiring
        certbot renew
    fi

    # finally, run the server
    cd /app
    /usr/local/bin/uvicorn main:app --host 0.0.0.0 --port 443 \
        --ssl-keyfile=/etc/letsencrypt/live/api-wl.greenelab.com/privkey.pem \
        --ssl-certfile=/etc/letsencrypt/live/api-wl.greenelab.com/fullchain.pem
else
    # finally, run the server
    cd /app
    /usr/local/bin/uvicorn main:app --host 0.0.0.0 --port 80
fi
