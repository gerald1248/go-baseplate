# go-baseplate
generic template for Golang applications

This template does next to nothing - it echoes back any JSON it receives -  but it sets up a number of facilities that are useful as you start to add functionality.

It bundles:

* a command-line interface for batch processing (files or STDIN)

* an HTTPS server that self-certifies on startup and accepts POST requests

* a rudimentary Bootstrap GUI

`go-baseplate` compiles to a single executable and never writes to disk. It accepts JSON input, parses and returns it (provided it is valid JSON); that is all it does.

The `gulp` build process goes through the usual steps of:

* building and packaging binaries for Linux, Mac and Windows

* reformatting/analysing/testing

* minifying/uglifying/concatenating the web components
