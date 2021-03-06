package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"github.com/elazarl/go-bindata-assetfs"
	"github.com/gerald1248/httpscerts"
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

type PostStruct struct {
	Buffer string
}

func serve(appname, certificate, key, hostname string, port int) {
	virtual_fs := &assetfs.AssetFS{
		Asset:     Asset,
		AssetDir:  AssetDir,
		AssetInfo: AssetInfo}

	//set up custom mux
	mux := http.NewServeMux()
	mux.Handle("/static/", http.FileServer(virtual_fs))
	mux.HandleFunc("/"+appname+"/console", guiHandler)
	mux.HandleFunc("/"+appname, handler)

	err := httpscerts.Check(certificate, key)
	if err != nil {
		cert, key, err := httpscerts.GenerateArrays(fmt.Sprintf("%s:%d", hostname, port))
		if err != nil {
			log.Fatal("Can't create https certs")
		}

		keyPair, err := tls.X509KeyPair(cert, key)
		if err != nil {
			log.Fatal("Can't create key pair")
		}

		var certificates []tls.Certificate
		certificates = append(certificates, keyPair)

		cfg := &tls.Config{
			MinVersion:               tls.VersionTLS12,
			PreferServerCipherSuites: true,
			Certificates:             certificates,
		}

		s := &http.Server{
			Addr:           fmt.Sprintf("%s:%d", hostname, port),
			Handler:        mux,
			ReadTimeout:    10 * time.Second,
			WriteTimeout:   10 * time.Second,
			MaxHeaderBytes: 1 << 20,
			TLSConfig:      cfg,
		}
		fmt.Print(listening(appname, hostname, port, true))
		log.Fatal(s.ListenAndServeTLS("", ""))
	}
	fmt.Print(listening(appname, hostname, port, false))
	log.Fatal(http.ListenAndServeTLS(fmt.Sprintf("%s:%d", hostname, port), certificate, key, mux))
}

func listening(appname, hostname string, port int, selfCert bool) string {
	var selfCertMsg string
	if selfCert {
		selfCertMsg = " (self-certified)"
	}
	return fmt.Sprintf("Listening on port %d%s\n"+
		"POST JSON sources to https://%s:%d/%s\n"+
		"Go to https://%s:%d/%s/console\n", port, selfCertMsg, hostname, port, appname, hostname, port, appname)
}

func guiHandler(w http.ResponseWriter, r *http.Request) {
	//show GUI from static resources
	bytes, _ := Asset("static/index.html")
	fmt.Fprintf(w, "%s\n", string(bytes))
}

func handler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "POST":
		handlePost(&w, r)
	case "GET":
		handleGet(&w, r)
	}
}

func handleGet(w *http.ResponseWriter, r *http.Request) {
	//fetch configuration list
	fmt.Fprintf(*w, "GET request\nRequest struct = %v\n", r)
}

func handlePost(w *http.ResponseWriter, r *http.Request) {
	//process configuration list
	body, err := ioutil.ReadAll(r.Body)

	if err != nil {
		fmt.Fprintf(*w, "Can't read POST request body: %s", err)
		return
	}

	result, err := processBytes(body)
	if err != nil {
		fmt.Fprintf(*w, "Can't process POST request body: %s\n%s\n", err, body)
		return
	}

	json, err := json.Marshal(result)
	if err != nil {
		fmt.Fprintf(*w, "Can't encode result: %s", err)
		return
	}

	fmt.Fprintf(*w, string(json))
}
