#!/bin/bash
set -e
wails build -p -x "darwin/amd64"
wails build -p -x "linux/amd64"
wails build -p -x "windows/amd64"
