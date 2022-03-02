#!/usr/bin/env python

from collections import Counter
import logging
import os
import grequests as grq
import requests as rq
from tqdm import tqdm

# list of words with which to populate the cache
WORD_LIST = os.environ.get('WORD_LIST', "./google-10000-english-usa.txt")

# get the root server URL from the env, if possible
# remove possible trailing slash so we can construct URLs more easily
SERVER_URL = os.environ.get('SERVER_URL', 'https://api-wl.greenelab.com').rstrip('/')

# RQ_CONCURRENCY is the number of parallel workers that'll be hitting the API
# it should be at most the number of workers, and ideally a bit less to provide
# service to user requests, too
RQ_CONCURRENCY = int(os.environ.get('RQ_CONCURRENCY', 1))

# if true, attempts to read RQ_CONCURRENCY from server meta config block
# if false, uses the env var RQ_CONCURRENCY or 1 if not provided
USE_SERVER_CONCURRENCY=False

# create logger with 'spam_application'
logger = logging.getLogger('cache_populator')
logger.setLevel(logging.DEBUG)
# create file handler which logs even debug messages
fh = logging.FileHandler('non_200s.log')
fh.setLevel(logging.DEBUG)
logger.addHandler(fh)

def main():
    global RQ_CONCURRENCY

    if USE_SERVER_CONCURRENCY:
        # do an initial request for metadata, to set RQ_CONCURRENCY
        meta = rq.get(SERVER_URL)
        # print(json.dumps(meta.json(), indent=2))
        # overwrite RQ_CONCURRENCY with what we found
        RQ_CONCURRENCY = int(meta.json().get('config', {}).get('RQ_CONCURRENCY', 1))
        print(f"* Server workers: {RQ_CONCURRENCY}")

    # print gathered info so far
    print(f"* Server URL: {SERVER_URL}")
    print(f"* Parallel requests: {RQ_CONCURRENCY}")

    # build requests to send out
    print("Building requests set...")
    with open(WORD_LIST) as fp:
        reqs = [
            grq.get(f"{SERVER_URL}/neighbors?tok={word.strip()}")
            for word in tqdm(fp.readlines())
        ]
    
    # map out requests, then progress as they're completed
    print("Processing requests...")
    reqs_set = grq.imap(reqs, size=RQ_CONCURRENCY)
    pbar = tqdm(
        reqs_set, total=len(reqs),
        dynamic_ncols=True, smoothing=0.0
    )

    responses = Counter()
    for resp in pbar:
        responses[resp.status_code] += 1

        if resp.status_code != 200:
            logger.debug(f"{resp.status_code} : {resp.request.url}\n")

        pbar.set_description(
            ", ".join(f"{x}:{responses[x]}" for x in responses)
        )

if __name__ == '__main__':
    main()
