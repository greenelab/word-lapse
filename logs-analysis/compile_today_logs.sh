#!/usr/bin/env bash

TODAY_DATE=$( date '+%Y-%m-%d' )
SED_FIELD_EXTRACTOR="s;.*KEY_\(.*\):.*key=wlc:backend.main.neighbors(.*=\(.*\),.*=\(.*\)).*;\2,\3,\1;p" 

FILTER=$( cat <<EOF
 (resource.type="gce_instance" AND resource.labels.instance_id="7592604010386050600") OR (resource.type="global" AND jsonPayload.instance.id="7592604010386050600")
 logName="projects/word-lapse/logs/cos_containers"
 jsonPayload.message=~"INFO:fastapi_redis_cache.client: .*: key=wlc:backend.main.neighbors([^)]+)"
 timestamp>="$TODAY_DATE"
EOF
)

COMPILE_RESULTS=${COMPILE_RESULTS:-1}

if [ ${COMPILE_RESULTS} -eq 1 ]; then
    (
        echo "token,corpus,cached,count"
        # sed: extracts token, corpus, cache status as comma-delimited lines
        # awk: adds counter of unique occurrences of each line
        gcloud logging read "$FILTER"  --format="value(jsonPayload.message)" \
            | sed -n "$SED_FIELD_EXTRACTOR" \
            | awk '{a[$1]++}END{for (i in a) print i,a[i] | "sort"}' OFS=","
    )
else
    # just print out the raw logs, squeezing the newlines out
    gcloud logging read "$FILTER"  --format="value(jsonPayload.message)" | tr -s '\n'
fi