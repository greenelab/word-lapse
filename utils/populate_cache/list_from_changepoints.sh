#!/usr/bin/env bash

cd ../../server/data

(
    cat abstract_changepoints.tsv | cut -f1 ;
    cat fulltext_changepoints.tsv | cut -f1
) | sort | uniq