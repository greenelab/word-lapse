#!/usr/local/bin/python

import json
import logging
import mmap
import pickle
from pathlib import Path
from pprint import pprint

import redis
from tqdm import tqdm
from pygtrie import CharTrie

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

data_folder = Path("../data")

def get_concept_trie() -> CharTrie:
    logger.info("Starting concept trie load...")

    concept_trie_pickle = data_folder / Path("concept_trie.pkl")

    # attempt to use pickled trie b/c generating it takes 45 minutes(!)
    with open(concept_trie_pickle, "rb") as fp:
        with mmap.mmap(fp.fileno(), length=0, access=mmap.ACCESS_READ) as mmap_obj:
            concept_trie = pickle.load(mmap_obj)
            logger.info("...concept trie loading done!")

    return concept_trie

def get_concept_id_mapper():
    """
    Loads the concept mapper into a python dictionary format
    """

    pickled_path = data_folder / Path("concept_dict.pkl")

    with open(pickled_path, "rb") as fp:
        with mmap.mmap(
            fp.fileno(), length=0, access=mmap.ACCESS_READ
        ) as mmap_obj:
            concept_id_mapper_dict = pickle.load(mmap_obj)

    return concept_id_mapper_dict

def main():
    r = redis.Redis( host='localhost', port=6379)

    print("Loading concept dict...")
    concept_dict = get_concept_id_mapper()
    # print("Inverting dict...")
    # inverted_concept_dict = {v: k for k, v in concept_dict.items()}
    # del concept_dict
    print("...done!")

    corrections = 0

    for cached_key in tqdm(r.scan_iter('wlc:*'), total=75471):
        # print("Key: %s" % cached_key.decode("utf8", "ignore"))
        decoded = json.loads(r.get(cached_key))

        # operate on the decoded value, i.e. map the tag_id to something else
        for year, neighbors in decoded['neighbors'].items():
            for n_idx, neighbor in enumerate(neighbors):
                tag_id = neighbor['tag_id']
                if tag_id and tag_id in concept_dict:
                    new_token = concept_dict[tag_id]
                    if neighbor['token'] != new_token:
                        decoded['neighbors'][year][n_idx]['token'] = new_token
                        corrections += 1

        r.set(cached_key, json.dumps(decoded))

    print("Corrections: %d" % corrections)


if __name__ == '__main__':
    main()
