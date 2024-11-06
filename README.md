# Solana Wallet Snap Monorepo

<img src="./packages/snap/images/icon.svg" width="200" style="display: block; margin: 0 auto;" alt="Solana Logo" />

## Getting Started

The Solana Wallet Snap allows MetaMask and dapps to manage accounts and manage state on Solana network.

- [@metamask/solana-wallet-snap](packages/snap/README.md)
- [@metamask/solana-wallet-test-dapp](packages/site/README.md)

## Prerequisites

- [MetaMask Flask](https://consensyssoftware.atlassian.net/wiki/x/IQCOB10)
- Nodejs `20`
- yarn 3.8.6 (Due to MetaMask packages incompatibilities)

> [!IMPORTANT]
> We **strongly** recommend you install via [NVM](https://github.com/creationix/nvm) to avoid incompatibility issues between different node projects.
> Once installed, you should also install [Yarn](http://yarnpkg.com/) with `npm i -g yarn` to make working with this repository easiest.

## Setup

1. Clone the project

```bash
git clone git@github.com:MetaMask/snap-solana-wallet.git
cd snap-solana-wallet
```

2. Use the correct Node version

```bash
nvm use
```

3. Install dependecies

```bash
yarn
```

4. Start the project

```bash
yarn start
```

> [!NOTE]  
> This will start both the snap and the dapp
>
> - Snap server and debug page: http://localhost:8080/
> - Example UI dapp: http://localhost:3000/

For more detail on Snap or DApp development, refer to its respective README.
