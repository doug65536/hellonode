# hellonode
Simplest possible node server.
Serves the content of the public directory.
html files are preprocessed for <?include 'filename' ?> directives
Paths are relative to the root of the public directory if they begin with /,
otherwise they are relative to the file containing the  <?include 'x'?> file

