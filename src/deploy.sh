#!/usr/bin/env sh

# abort on errors
set -e

# get the origin 
ORIGIN=$(git config --get remote.origin.url)
echo $ORIGIN

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
mkdir public
cp -r ../../examples examples
git add -A
git commit -m 'deploy'

# if you are deploying to https://<USERNAME>.github.io/<REPO>
git push -f $ORIGIN main:gh-pages

cd -

