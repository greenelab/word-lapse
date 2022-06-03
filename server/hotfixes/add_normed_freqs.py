#!/usr/local/bin/python

import sys
import json
import logging
import re
from pathlib import Path

import pandas as pd
import plydata as ply
import redis
from tqdm import tqdm

# patch the server code path into the pythonpath
sys.path.append(str(Path('..').resolve()))

from backend.config import CORPORA_SET
from backend.tracking import ExecTimer

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

data_folder = Path("../data")

# if true, skips writing back to the cache
DRY_RUN = False
# if true, forces rewriting frequencies even if the entry appears to be up-to-date
FORCE_REWRITE_FREQS = False

corpus_paths = {
    "pubtator": data_folder / Path("all_pubtator_tok_frequency.tsv.xz"),
    "preprints": data_folder / Path("all_preprint_tok_frequency.tsv.xz"),
}

with ExecTimer(verbose=True):
    print("Loading corpora...")
    frequency_tables_ungropued = {
        corpus: (
            pd.read_csv(corpus_paths[corpus], sep="\t")
            >> ply.group_by("year")
            >> ply.define(total="sum(word_count)")
            >> ply.ungroup()
        )
        for corpus in corpus_paths
    }
    print("done!")

def extract_frequencies(tok: str, corpus: str):
    frequency_output_df = (
        frequency_tables_ungropued[corpus]
        >> ply.query("tok == @tok")
        >> ply.define(normalized="word_count/total") 
        >> ply.select("year", "word_count", "normalized")
        >> ply.arrange("year")
        >> ply.rename({"frequency": "word_count", "normalized_frequency": "normalized"})
        >> ply.call(".astype", {"year": int, "frequency": int, "normalized_frequency": float})
    )

    return frequency_output_df >> ply.call(".to_dict", orient="records")


def main():
    r = redis.Redis( host='localhost', port=6379)

    corrections = 0
    skips = 0
    already_updated = 0
    renames = 0

    if DRY_RUN:
        logger.info("DRY_RUN enabled, cache won't be modified")

    # get number of records so we can build a progress bar
    logger.info("Computing total records...")
    total_recs = sum(1 for _ in r.scan_iter('wlc:*'))
    logger.info("done! %d entries found" % total_recs)

    corpora_labels_to_ids = {
        v: k for k, v in CORPORA_SET.items()
    }

    with ExecTimer(verbose=True):
        for cached_key in tqdm(r.scan_iter('wlc:*'), total=total_recs):
            decoded = json.loads(r.get(cached_key))

            try:
                tok, corpus = re.match(
                    r".*\(tok=(.+),corpus=(.+)\)",
                    str(cached_key)
                ).groups()
            except AttributeError:
                tqdm.write("Skipped key '%s' due to regex not matching" % cached_key)
                skips += 1
                continue

            # check if the corpus label rather than the corpus id was specified
            # if so, rename the key and continue
            if corpus in corpora_labels_to_ids:
                old_key = cached_key
                cached_key = str(cached_key).replace(corpus, corpora_labels_to_ids[corpus])
                corpus = corpora_labels_to_ids[corpus]
                r.rename(old_key, cached_key)
                renames += 1
                tqdm.write("Corrected corpus label; %s => %s" % (old_key, cached_key))

            tqdm.write("Token: %s, corpus: %s" % (tok, corpus))

            # if the key already has 'normalized_frequency' in it, it's been updated
            if (
                (
                    len(decoded['frequency']) > 0
                    and 'normalized_frequency' in decoded['frequency'][0]
                )
                and not FORCE_REWRITE_FREQS
            ):
                tqdm.write("Key '%s' is already updated, continuing..." % cached_key)
                already_updated += 1
                continue

            decoded['frequency'] = extract_frequencies(tok=tok, corpus=corpus)
            corrections += 1

            if not DRY_RUN:
                r.set(cached_key, json.dumps(decoded))

    print("Corrections: %d" % corrections)
    print("Skipped due to missing key: %d" % skips)
    print("Renamed: %d" % renames)
    print("Already updated: %d" % already_updated)

if __name__ == '__main__':
    main()
