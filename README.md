# hellonode

## Simplest possible node server.

- Serves the content of the public directory.
- html files are preprocessed for <?include 'filename' ?> directives
- Paths are relative to the root of the public directory if they begin with /,
  otherwise they are relative to the file containing the  <?include 'x'?> file

## Installation

    cd somewhere-good
    git clone https://github.com/doug65536/hellonode
    cd hellonode
    npm i


## Run for debugging (auto-rerun on code changes)
    npm run-script rerun

## Run normally
    npm run-script run




