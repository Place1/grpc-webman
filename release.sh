#!/bin/bash
set -eou pipefail

REPO="grpc-webman"

if ! [ -x "$(command -v github-release)" ]; then
  echo 'please install github-release using "go get github.com/aktau/github-release"'
fi

if [[ -z "$GITHUB_TOKEN" ]]; then
  echo 'please set the $GITHUB_TOKEN variable'
  exit 1
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

read -p 'GitHub Username: ' USERNAME

echo "The current release is: $(git tag --list | tail -n 1)"
read -p 'Tag (e.g. v1.0.0): ' TAG

echo "building..."
./package.sh

echo "tagging release in git"
git tag -a "$TAG" -m "$TAG"
git push --tags

echo "creating release"
github-release release \
  --user "$USERNAME" \
  --repo "$REPO" \
  --tag "$TAG" \
  --name "$TAG"

echo "uploading artifacts"
ARTIFACTS=(
  "grpcwebman-darwin-amd64.app.tar.gz"
  "grpcwebman-darwin-10.6-amd64"
  "grpcwebman-linux-amd64"
  "grpcwebman-windows-4.0-amd64.exe"
)
for ARTIFACT in "${ARTIFACTS[@]}"; do
  echo "uploading: $ARTIFACT"
  github-release upload \
    --user "$USERNAME" \
    --repo "$REPO" \
    --tag "$TAG" \
    --name "$ARTIFACT" \
    --file "./build/$ARTIFACT"
done

echo "done"
