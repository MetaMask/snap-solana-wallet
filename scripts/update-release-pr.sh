#!/usr/bin/env bash

set -x
set -e
set -o pipefail

git config user.name github-actions
git config user.email github-actions@github.com

# Fetch all branches
git fetch --all

# List all branches that match the release pattern and sort them by commit date
RELEASE_BRANCH_NAME=$(git for-each-ref --sort=-committerdate --format='%(refname:lstrip=-2)' refs/remotes/origin/release/* | head -n 1)

# Check if RELEASE_BRANCH_NAME is empty
if [ -z "${RELEASE_BRANCH_NAME}" ]; then
  echo "No release branches found."
  exit 1
fi

echo "The latest release branch is: ${RELEASE_BRANCH_NAME}"

# Checkout the latest release branch
echo "Checking out branch: ${RELEASE_BRANCH_NAME}"
git checkout "${RELEASE_BRANCH_NAME}"

yarn --immutable --immutable-cache
yarn workspace @metamask/solana-wallet-snap build

if ! (git add . && git commit -m "chore: update snap version");
then
    echo "Error: No changes detected."
    exit 1
fi

git push --set-upstream origin "${RELEASE_BRANCH_NAME}"

