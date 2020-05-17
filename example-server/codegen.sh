#!/bin/bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

PATH="$PATH:$(go env GOPATH)/bin"

OUT_DIR="$DIR/proto"

mkdir -p "$OUT_DIR"

protoc \
  -I ./ \
  *.proto \
  --go_out="plugins=grpc:$OUT_DIR"
