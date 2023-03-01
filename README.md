# hellonode

Simple node server.

- Serves the content of the public directory.
- html files are preprocessed for <?include 'filename' ?> directives
- Paths are relative to the root of the public directory if they begin with /,
  otherwise they are relative to the file containing the  <?include 'x'?> file

## Include syntax

    <?include 'filename.html'?>
    <?include "filename.html"?>

- The closing quote must be the same kind as the opening quote.
- Neither quote is allowed in the filename, regardless of which quote is wrapped
around the value.
- There is no escaping.
- Relative paths are relative to the directory that contains the file 
doing the include.
- Absolute paths are relative to the root of the public directory tree.

## Installation

    cd somewhere-good
    git clone https://github.com/doug65536/hellonode
    cd hellonode
    npm i


## Run for debugging (auto-rerun on code changes)
    npm run-script rerun

## Run normally
    npm run-script run




