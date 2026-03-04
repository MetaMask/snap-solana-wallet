# Solana Wallet Snap Monorepo

![Hero Illustration](docs/hero.png)

Bringing official Solana support to MetaMask. Create accounts, check balances, and use Solana dApps right from your MetaMask wallet. Simple, secure, and seamless.

## Installation

This repository contains the Solana Wallet Snap, which is a plugin for MetaMask. To use it, you'll need to:

1. First, clone and set up the [MetaMask Extension repository](https://github.com/MetaMask/metamask-extension)
2. Then install this snap in your local MetaMask extension development environment:

```bash
# In your metamask-extension directory
npm i @metamask/snap-solana-wallet
# or
yarn add @metamask/snap-solana-wallet
```

This dual repository setup allows you to develop and test the Solana Wallet Snap alongside the main MetaMask extension. The snap is installed as a dependency in the MetaMask extension repository, where it can be tested and integrated.

## API Documentation

MetaMask interacts with the Solana Wallet Snap via its [JSON-RPC API](packages/snap/openrpc.json). The complete API specification is documented in the OpenRPC format.

### Viewing the API Documentation

The API documentation is located in [`packages/snap/openrpc.json`](packages/snap/openrpc.json). To view it in a user-friendly format:

1. Go to the [OpenRPC Playground](https://playground.open-rpc.org/), or any other OpenRPC viewer of your liking
2. Copy the contents of [`packages/snap/openrpc.json`](packages/snap/openrpc.json)
3. Paste it into the playground's editor
4. Explore the interactive documentation with method details, parameters, examples, and error specifications

### Available Methods

The API includes methods for:

- **Wallet operations** - Account management, transaction signing and broadcasting, and message signing
- **Protocol requests** - Direct interaction with Solana RPC methods
- **Client-only requests** (as defined in [SIP-31](https://github.com/MetaMask/SIPs/blob/main/SIPS/sip-31.md)) - For operations like Swap/Bridge without user confirmation

## Contributing

We welcome contributions to the Solana Wallet Snap! Please read our [Contributing](docs/contributing.md) guidelines to get started.
