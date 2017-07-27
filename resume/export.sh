#!/usr/bin/env bash

INPUT_SKETCH_FILE=resume.sketch
SKETCH_ARTBOARD_NAME=resume
EXPORT_DIR=dist

# Export Sketch artboard of resume into .pdf file
sketchtool export artboards \
  --formats="pdf" \
  --items=$SKETCH_ARTBOARD_NAME \
  --output=$EXPORT_DIR \
  --save-for-web=YES \
  --scales="1.0" \
  $INPUT_SKETCH_FILE

# Export Sketch artboard of resume into .png files
sketchtool export artboards \
  --formats="png" \
  --items=$SKETCH_ARTBOARD_NAME \
  --output=$EXPORT_DIR \
  --save-for-web=YES \
  --scales="2.0" \
  $INPUT_SKETCH_FILE

mv "$EXPORT_DIR/resume@2x.png" "$EXPORT_DIR/resume.png"
echo "Exported resume@2x.png renamed to resume.png"