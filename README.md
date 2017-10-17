# go-baseplate
This is a generic template for Golang applications. After cloning, you can change its name by entering a new project name in `package.json` and `Dockerfile`.

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

To build a minimal (`FROM scratch`) Docker image, run `gulp build-docker`.

To build the application, enter the following:

```
$ export GOPATH=$HOME/go
$ go get -u github.com/jteeuwen/go-bindata/...
$ go get -u
$ npm install
$ node_modules/gulp/bin/gulp build
```

Docker
------
`openshift-linter` is intended to run on `FROM scratch` Docker containers. To trigger a Linux build, build the image and run it, enter:
```
$ node_modules/gulp/bin/gulp  build-docker
```
If you'd rather use an existing image, you may wish to run `docker pull gerald1248/go-baseplate:latest`.
