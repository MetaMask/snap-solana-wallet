# Contributing to Snap Solana Wallet

Thank you for your interest in contributing to the Snap Solana Wallet project! This guide will help you get started with development and understand our contribution workflow.

## Prerequisites

- [MetaMask Flask](https://consensyssoftware.atlassian.net/wiki/x/IQCOB10) is required for testing the snap locally
- [NVM](https://github.com/creationix/nvm) to manage Node.js and avoid compatibility issues between different projects
- Node.js `v22.17.0` as specified in `.nvmrc`
- Yarn `3.8.6` is required due to MetaMask package compatibility

## 🚀 Quick Start

```bash
# Clone and setup
git clone git@github.com:MetaMask/snap-solana-wallet.git
cd snap-solana-wallet
nvm use
yarn

# Configure environment
cp packages/snap/.env.sample packages/snap/.env
cp packages/site/.env.development.sample packages/site/.env.development

# Start development servers
yarn start # Runs snap server on local port `8080` and the test dapp at http://localhost:3000

# Lastly, install the snap in MetaMask Flask by following the steps below.
```

## 🧪 Testing Your Changes

### Manual Testing

#### Setting up MetaMask Flask

To test the snap manually, you will need to install it in MetaMask Flask. Follow these steps to set up MetaMask Flask:

1. Locate the directory [`./metamask-extension-overrides`](./metamask-extension-overrides)
2. Copy all files from there to the corresponding locations in your `metamask-extension` repository. Make sure you remove the `.txt` extension from the file name. These overrides are for local development only - do not commit them.
3. Start MetaMask Flask with `yarn:start:flask` in your local `metamask-extension` repository
4. Install the development version in your browser

#### Installing the snap in MetaMask Flask

1. Ensure your snap `.env` file is configured with `ENVIRONMENT=local`
2. Start both the snap and test dapp with `yarn start`
3. Make your code changes
4. Wait for the snap to rebuild (you'll see `[@metamask/solana-wallet-snap]: [0] ✔ Done!` in the console)
5. Open the test dapp in your browser at http://localhost:3000/
6. Click the `Reconnect` button to install the locally running snap into MetaMask Flask. This overrides the preinstalled Solana snap.

🎉 Congratulations, you're now ready to test your changes locally! You can interact with your snap through the test dapp and through the extension, and verify that everything works as expected.

### Unit Tests

1. Configure your snap `.env` file with `ENVIRONMENT=test`
2. Ensure the snap is running with `yarn start`
3. Run the test suite with `yarn test`

## 🧑‍💻 Contribution Workflow

### Branch Management

- Use the "Create branch" feature in Jira to generate properly named branches
- Branch names should include the ticket ID (e.g., `SOL-10`) and a brief description

### Commit Guidelines

We use `commitlint` to enforce the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format. This helps maintain a clean changelog and consistent commit history. For a clean changelog, prefer using `feat` and `fix` commit types.

Git hooks are configured to automatically:

- Lint your commit messages
- Fix formatting and linting issues

### Pull Requests

To create a successful PR:

1. Configure your snap `.env` file with `ENVIRONMENT=production`
2. Re-start the snap by killing your currently running `yarn start`, and running it again
3. Ensure all automated checks pass
4. Write a clear and detailed description
5. Link the PR to a Jira ticket (use the "Create branch" feature from Jira)
6. Include appropriate tests for your changes
