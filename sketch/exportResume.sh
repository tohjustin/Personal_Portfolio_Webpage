#!/usr/bin/env bash

EXPORT_DIR=dist
INPUT_SKETCH_FILE=$1
OUTPUT_FILENAME=resume-justintoh
SKETCH_ARTBOARD_NAME=resume

# Export artboard into .pdf file
sketchtool export artboards \
  --formats="pdf" \
  --items=$SKETCH_ARTBOARD_NAME \
  --output=$EXPORT_DIR \
  --save-for-web=YES \
  --scales="1.0" \
  $INPUT_SKETCH_FILE

mv "$EXPORT_DIR/resume.pdf" "$EXPORT_DIR/$OUTPUT_FILENAME.pdf"
echo "Exported resume.pdf renamed to $OUTPUT_FILENAME.pdf"

# Export artboard into .png files
sketchtool export artboards \
  --formats="png" \
  --items=$SKETCH_ARTBOARD_NAME \
  --output=$EXPORT_DIR \
  --save-for-web=YES \
  --scales="2.0" \
  $INPUT_SKETCH_FILE

mv "$EXPORT_DIR/resume@2x.png" "$EXPORT_DIR/$OUTPUT_FILENAME.png"
echo "Exported resume@2x.png renamed to $OUTPUT_FILENAME.png"