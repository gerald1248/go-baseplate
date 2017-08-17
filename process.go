package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
)

func processBytes(bytes []byte) (string, error) {
	var data interface{}
	err := json.Unmarshal(bytes, &data)
	if err != nil {
		return "", err
	}

	result := string(bytes[:])
	return result, nil
}

func processFile(path string) (string, error) {
	bytes, err := ioutil.ReadFile(path)
	if err != nil {
		return "", errors.New(fmt.Sprintf("can't read %s: %v", path, err))
	}

	result, err := processBytes(bytes)

	if err != nil {
		return "", errors.New(fmt.Sprintf("can't process %s: %s", path, err))
	}

	return result, nil
}
