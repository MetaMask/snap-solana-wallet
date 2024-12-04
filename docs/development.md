# Development

## Local development with Flask

To start local development using the extension, you can follow these steps:

1. Run `yarn start` from the root of this project. It will start the snap at `http://localhost:8080` and the site dapp at `http://localhost:3000`.
2. Open the [MetaMask extension](https://github.com/MetaMask/metamask-extension) codebase and point the `SOLANA_WALLET_SNAP_ID` in `shared/lib/accounts/solana-wallet-snap.ts` to `http://localhost:8080`. This ensures that all requests will go to your local snap.
3. Run MetaMask Flask locally from the extension codebase with `yarn start:flask`, you can check the [README](https://github.com/MetaMask/metamask-extension?tab=readme-ov-file#building-on-your-local-machine) for more details.

> [!NOTE]  
> For both repositories, always run `nvm use` and `yarn install` before starting.

## Build

```bash
yarn build
```

> [!NOTE]  
> This script will watch your file system and update the snap

## Linting

```bash
yarn lint
```

> [!NOTE]  
> Uses eslint in order to look for issues on your code

If you want to fix your linting issues automatically use

```bash
yarn lint:fix
```

## Formatting

```bash
yarn prettier:check
```

> [!NOTE]  
> Uses prettier in order to look for formatting issues on your code

If you want to fix your formatting issues automatically use

```bash
yarn prettier:fix
```

## Updating translations messages (i18n)

Any time you need to add/edit a message to be translated you will need to:

- Edit `packages/snap/messages.json`
- Run `yarn locale:build`

> [!NOTE]  
> This will update the `packages/snap/locales/en.json` file which will be used by Crowdin. This will also run in the normal build process.
