#!/bin/bash
set -e
wails build -p -x "darwin/amd64"
tar czf build/grpcwebman-darwin-amd64.app.tar.gz build/GRPCWebman.app

wails build -p -x "linux/amd64"
wails build -p -x "windows/amd64"
