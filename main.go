package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"time"
)

//Supports command line, server and GUI use
func main() {
	appname := filepath.Base(os.Args[0])
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "Usage: %s [<JSON file> [<JSON file>]]\nAlternatively, pipe input to STDIN: cat input.json | %s\n", appname, appname)
		flag.PrintDefaults()
		os.Exit(0)
	}

	certificate := flag.String("c", "cert.pem", "TLS server certificate")
	key := flag.String("k", "key.pem", "TLS server key")
	host := flag.String("n", "localhost", "hostname")
	port := flag.Int("p", 8443, "listen on port")

	flag.Parse()
	args := flag.Args()

	//use case [A]: STDIN handling
	stdinFileInfo, _ := os.Stdin.Stat()
	if stdinFileInfo.Mode()&os.ModeNamedPipe != 0 {
		stdin, _ := ioutil.ReadAll(os.Stdin)
		result, err := processBytes(stdin)

		if err != nil {
			fmt.Fprintf(os.Stderr, "%v\n", err)
			os.Exit(1)
		}

		fmt.Println(result)

		os.Exit(0)
	}

	//use case [B]: server
	if len(args) == 0 {
		serve(appname, *certificate, *key, *host, *port)
		os.Exit(0)
	}

	// use case [C]: file input
	for _, arg := range args {
		start := time.Now()
		buffer, err := processFile(arg)
		secs := time.Since(start).Seconds()

		if err != nil {
			fmt.Fprintf(os.Stderr, "%s: %v (%.2fs)\n", arg, err, secs)
			os.Exit(1)
		}
		fmt.Println(buffer)
		os.Exit(0)
	}
}
