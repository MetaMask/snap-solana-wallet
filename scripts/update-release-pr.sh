#!/usr/bin/env bash

set -x
set -e
set -o pipefail

RELEASE_BRANCH_NAME="release/$(jq -r .version < package.json)"

if [[ -z $RELEASE_BRANCH_NAME ]]; then
  echo "Error: No release branch specified."
  exit 1
fi

git config user.name github-actions
git config user.email github-actions@github.com

git checkout "${RELEASE_BRANCH_NAME}"

yarn --immutable --immutable-cache
yarn workspace @metamask/solana-wallet-snap build

if ! (git add . && git commit -m "chore: update snap version");
then
    echo "Error: No changes detected."
    exit 1
fi

git push --set-upstream origin "${RELEASE_BRANCH_NAME}"

