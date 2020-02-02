#!/usr/bin/env bash

EXPORT_DIR=dist

mkdir -p $EXPORT_DIR
cp -a ./assets/*.pdf "$EXPORT_DIR"/
