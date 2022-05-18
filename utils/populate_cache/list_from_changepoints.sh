#!/usr/bin/env bash

cd ../../server/data

(
    cat preprint_changepoints.tsv | cut -f1 ;
    cat pubtator_changepoints.tsv | cut -f1 ;
    cat abstract_changepoints.tsv | cut -f1
) | sort | uniq
