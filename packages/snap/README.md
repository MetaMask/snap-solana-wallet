# @metamask/solana-wallet-snap

This snap represents the Solana wallet for MetaMask.

## Running the snap locally

```bash
cp src/packages/snap/.env.example src/packages/snap/.env
# Set content from https://my.1password.com/app#/gebbq4jvzj7iexnbirelfitv2y/AllItems/gebbq4jvzj7iexnbirelfitv2yvis64f7yhxuoi277r3hagj7ndi

yarn workspace @metamask/solana-wallet-snap start
```

> [!WARNING]  
> When snap updates you will need to still reconnect from the dapp to see changes

> [!TIP]
> Alternatively you can build and serve the snap manually. This can sometimes be more stable than watch mode but requires a manual rebuild and serve anytime there is a change on the snap.

## Changing env vars

> [!WARNING]  
> The `.env` values are bundled into the built snap and affect its [shasum](./snap.manifest.json#L10). To avoid build failures in CI, make sure your local `.env` file matches exactly with the CI repository secrets. Any mismatch will cause the CI to reject the build due to different checksums.

If you need to change the environment variables, follow this checklist:

1. Update the `src/packages/snap/.env` file with the new keys and/or values
2. Update the `src/packages/snap/.env.example` file with the new keys
3. Update the [1Password](https://my.1password.com/app#/gebbq4jvzj7iexnbirelfitv2y/AllItems/gebbq4jvzj7iexnbirelfitv2yvis64f7yhxuoi277r3hagj7ndi) entry with the new values
4. Update the [GitHub repository secrets](https://github.com/MetaMask/solana-wallet-snap/settings/secrets) with the new values
5. Run `yarn start` to regenerate the build and its shasum

## Building and serving snap manually

```bash
yarn workspace @metamask/solana-wallet-snap build
yarn workspace @metamask/solana-wallet-snap serve
```

Further reading:

- [Development](../../docs/development.md)
- [Contributing](../../docs/contributing.md)
- [Testing](../../docs/testing.md)
- [Releasing](../../docs/release.md)
