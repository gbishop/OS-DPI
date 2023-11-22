#!/bin/bash

# remove branches that are no longer necessary
# but tag them so I can find them if necessary

# branches to keep
keep="main pointergroups"
delimiter=" "

# get current branches
branches=$(git branch --format='%(refname:short)');

for name in $branches;
do
  # if it is in the keep list skip it
  if [[ "$keep" =~ ($delimiter|^)$name($delimiter|$) ]];
  then
    continue;
  fi
  # apply a tag so I can find it
  git tag archive/$name $name
  # remove it
  git branch -D $name
done
