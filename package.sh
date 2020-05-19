#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# clean
rm -r ./build/ || true

# package for all platforms
wails build -p -x "darwin/amd64"
tar czf build/grpcwebman-darwin-amd64.app.tar.gz build/GRPCWebman.app
wails build -p -x "linux/amd64"
wails build -p -x "windows/amd64"
