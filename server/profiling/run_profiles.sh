#!/usr/bin/env bash

# strategy: iterate over profiles, deploying the machine with each run, doing a
# no-op warmup query, then firing off three queries and storing the results to
# a logfile

# possible settings:
# - USE_MEMMAP = <true/false>
#   sets whether numpy memmap is used, increasing disk i/o but decreasing memory footprint
# - MATERIALIZE_MODELS = <true/false>
#   whether to load models all at once or one-by-one as needed (works poorly w/parallelization) 
# - WARM_CACHE = <true/false>
#   whether to load the models when the server boots; MATERIALIZE_MODELS must be true
# - PARALLELIZE_QUERY = <true/false>
#   whether to enable parallelization across years
# - PARALLEL_POOLS = <integer>
#   number of parallel pools (threads/processes depends on backend) 
# - PARALLEL_BACKEND = <enum>
#   one of 'threading', 'loky', 'multiprocessing'

API_VM=word-lapse-api

declare -A PROFILES=(
    [memmap_off]="
USE_MEMMAP=false
MATERIALIZE_MODELS=true
WARM_CACHE=true
PARALLELIZE_QUERY=true
PARALLEL_POOLS=4
PARALLEL_BACKEND=loky
" \
    [memmap_on]="
USE_MEMMAP=true
MATERIALIZE_MODELS=true
WARM_CACHE=true
PARALLELIZE_QUERY=true
PARALLEL_POOLS=4
PARALLEL_BACKEND=loky
" \
    [noparallel]="
USE_MEMMAP=true
MATERIALIZE_MODELS=true
WARM_CACHE=true
PARALLELIZE_QUERY=false
PARALLEL_POOLS=1
PARALLEL_BACKEND=loky
" \
    [use_threading]="
USE_MEMMAP=true
MATERIALIZE_MODELS=true
WARM_CACHE=true
PARALLELIZE_QUERY=true
PARALLEL_POOLS=4
PARALLEL_BACKEND=threading
" \
    [use_threading_morepools]="
USE_MEMMAP=true
MATERIALIZE_MODELS=true
WARM_CACHE=true
PARALLELIZE_QUERY=true
PARALLEL_POOLS=20
PARALLEL_BACKEND=threading
" \
    [loky_morepools]="
USE_MEMMAP=true
MATERIALIZE_MODELS=true
WARM_CACHE=true
PARALLELIZE_QUERY=true
PARALLEL_POOLS=20
PARALLEL_BACKEND=loky
"
)


# ----------------------------------------------------------------------------
# --- constants and helpers
# ----------------------------------------------------------------------------

START_TIME=$( date +'%Y-%m-%d_%H:%M:%s' )

# profiling commands:
CURL_TRACK_SECS="curl -o /dev/null -s -w %{time_total}s,%{response_code}"
WARMUP_URL="https://api-wl.greenelab.com"
TARGET_URL="https://api-wl.greenelab.com/neighbors?tok=pandemic"

RESULTS_FILE="profiling_results__${START_TIME}.csv"

VERBOSE=${VERBOSE:-1}

# prints arg 1 as the first message, exits w/code arg 2 (or 1 if none supplied)
function fail_w_msg {
    echo "$1"
    exit ${2:-1}
}

# reads $start_time and $end_time (set as date +%s.%3), returning their difference
function elapsed_secs {
    echo "scale=3; $end_time - $start_time" | bc
}


# ----------------------------------------------------------------------------
# --- main runtime profiling
# ----------------------------------------------------------------------------

# before we do anything, check if the API server is running
if ( gcloud compute instances --project=word-lapse list --filter="name:${API_VM} AND status:TERMINATED" 2>&1 | grep "${API_VM}" ); then
    echo "*** ${API_VM} was terminated, starting now..."
    gcloud compute instances --project=word-lapse start ${API_VM}
    echo ""
fi

# iterates over $PROFILES, writing the results as rows into to $RESULTS_FILE

# print header
echo "profile,warmup_secs,q1_secs,q1_code,q2_secs,q2_code,q3_secs,q3_code" > "${RESULTS_FILE}"

for pname in "${!PROFILES[@]}"; do
    [[ ${VERBOSE} -eq 0 ]] || echo "--- Profile: ${pname}"
    # [[ ${VERBOSE} -eq 0 ]] || echo "Args: ${PROFILES[$pname]}"
    # take the env vars, remove newlines, join with commas
    JOINED_ARGS=$( echo "${PROFILES[$pname]}" | grep "\S" | paste -sd ',' - )
    # [[ ${VERBOSE} -eq 0 ]] || echo "Args (joined): ${JOINED_ARGS}"

    gcloud compute instances update-container --project=word-lapse --zone=us-central1-a \
        ${API_VM} \
        --container-env=${JOINED_ARGS} || fail_w_msg "failed to update, bailing"

    # wait for backend to come up
    [[ ${VERBOSE} -eq 0 ]] || echo "Warming up..."
    start_time=$(date +%s.%3)
    
    for i in $(seq 30 -1 0); do
        curl -o /dev/null --max-time 300 --connect-timeout 300 "${WARMUP_URL}" 2>/dev/null \
            && break \
            || ( [[ ${VERBOSE} -eq 0 ]] || echo "retrying (attempts left: $i)..." )

        sleep 15

        # we've run out of chances; stop the timer and exit
        if [[ $i -eq 0 ]]; then
            end_time=$(date +%s.%3)
            elapsed=$( elapsed_secs )
            echo "*** Host dead after ${elapsed} seconds, bailing"
            exit 1
        fi
    done

    # record how long the warmup took
    end_time=$(date +%s.%3)
    WARMUP_DELAY=$( elapsed_secs )

    [[ ${VERBOSE} -eq 0 ]] || echo "Performing queries..."

    # perform three queries for the same endpoint, saving the result in each.
    # each one produces two values, the delay and the HTTP response code
    # ('000' if a non-http failure occurred)
    QUERY_ONE=$( ${CURL_TRACK_SECS} "${TARGET_URL}" )
    QUERY_TWO=$( ${CURL_TRACK_SECS} "${TARGET_URL}" )
    QUERY_THREE=$( ${CURL_TRACK_SECS} "${TARGET_URL}" )

    echo "
    ${pname}
    ${WARMUP_DELAY}
    ${QUERY_ONE}
    ${QUERY_TWO}
    ${QUERY_THREE}
    " | grep "\S" | awk '{$1=$1;print}' | paste -sd ',' - \
     >> "${RESULTS_FILE}"

     echo ""
done
