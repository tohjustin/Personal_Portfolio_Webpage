#!/usr/bin/env bash

EXPORT_DIR=src/images
INPUT_SKETCH_FILE=$1
IMAGE_SIZES=( 512 384 192 152 144 128 96 72 )
OUTPUT_FILENAME=icon
SKETCH_ARTBOARD_NAME=icon
TEMP_DIR=tmp

# Export artboard into .png files
sketchtool export artboards \
  --formats="png" \
  --items=$SKETCH_ARTBOARD_NAME \
  --output=$TEMP_DIR \
  --save-for-web=YES \
  --scales="1.0" \
  $INPUT_SKETCH_FILE

# Takes in an image file & make copies of it in different sizes (based on webpage icon sizes)
inputFile="$TEMP_DIR/${OUTPUT_FILENAME}.png"
if [[ -f $inputFile ]]; then 
  fileFullname=$(basename "$inputFile") # converts "/path/to/dir/name.txt" to "name.txt"
  fileDir=$(dirname "$inputFile") # converts "/path/to/dir/name.txt" to "/path/to/dir"
  fileExt="${fileFullname##*.}" # converts "name.txt" to "txt"
  fileName="${fileFullname%.*}" # converts "name.txt" to "name"

  for i in "${IMAGE_SIZES[@]}"
  do
    newFilename="$TEMP_DIR"/"$fileName-$i"x"$i"."$fileExt" # eg. converts "name.png" to "name-512x512.png"
    cp $inputFile $newFilename # copies input file, w/ name as $newFilename
    sips -Z $i $newFilename # converts copied file
  done
else
  echo "File not found"
fi

# Copies process files to EXPORT_DIR
allIcons=$TEMP_DIR"/"$OUTPUT_FILENAME"-*.png"
echo $allIcons
cp $allIcons $EXPORT_DIR

# Clean up $TEMP_DIR
rm -rf $TEMP_DIR