#!/usr/bin/env sh

# abort on errors
set -e

cd ../production-OS-DPI
git pull ../OS-DPI

./deploy.sh
