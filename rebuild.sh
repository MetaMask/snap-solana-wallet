#!/bin/bash

get_version() {
  jq .version packages/snap/package.json | tr -d '"'
}

next_patch_version() {
  major="$( echo "$1" | cut -d. -f1 )"
  minor="$( echo "$1" | cut -d. -f2 )"
  patch="$( echo "$1" | cut -d. -f3 )"

  echo "${major}.${minor}.$(expr "$patch" + 1)"
}

readonly VERSION="$(get_version)"
readonly NEXT_VERSION="$(next_patch_version "$VERSION")"
sed -i'.backup' "s/\"version\": \"$VERSION\",/\"version\": \"$NEXT_VERSION\",/g" packages/snap/{package,snap.manifest}.json

yarn workspace @metamask/solana-wallet-snap build

echo -- Next version: $NEXT_VERSION

yalc push packages/snap
