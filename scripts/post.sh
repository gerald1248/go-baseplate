#!/bin/bash

curl https://localhost:8443/go-baseplate -H "Accept: application/json" --insecure -X POST -d @data/test.json
