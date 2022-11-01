#!/usr/bin/env sh

# abort on errors
set -e

# get the origin username
USERNAME=$(git config --get remote.origin.url | cut -d: -f2 | cut -d/ -f1)
echo $USERNAME

# build
npm run build

# navigate into the build output directory
cd dist

# place .nojekyll to bypass Jekyll processing
echo > .nojekyll

# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME

git init
git checkout -B main
git add -A
git commit -m 'deploy'

# if you are deploying to https://<USERNAME>.github.io/<REPO>
git push -f git@github.com:$USERNAME/OS-DPI.git main:gh-pages

cd -

