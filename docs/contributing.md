# Contributing to Snap Solana Wallet

Thank you for your interest in contributing to the Snap Solana Wallet project! This guide will help you get started with development and understand our contribution workflow.

## Quick Start

Here's the minimal setup to get started:

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
yarn start
```

> [!NOTE]
> For a complete setup with all prerequisites and detailed instructions, continue reading below.

## Development Setup

### Prerequisites

- [MetaMask Flask](https://consensyssoftware.atlassian.net/wiki/x/IQCOB10) is required for testing the snap locally
- Node.js `21.7.3` as specified in `.nvmrc`
- Yarn `3.8.6` is required due to MetaMask package compatibility

> [!IMPORTANT]
> We strongly recommend using [NVM](https://github.com/creationix/nvm) to manage Node.js versions and avoid compatibility issues between different projects.
> After installing NVM, install Yarn globally with `npm i -g yarn`.

### Initial Setup

1. Clone the repository:

   ```bash
   git clone git@github.com:MetaMask/snap-solana-wallet.git
   cd snap-solana-wallet
   ```

2. Set up the development environment:

   ```bash
   nvm use
   yarn
   ```

3. Configure environment variables:

   ```bash
   # Copy and configure snap environment variables
   cp packages/snap/.env.sample packages/snap/.env
   # Get the actual values from: https://my.1password.com/app#/gebbq4jvzj7iexnbirelfitv2y/AllItems/gebbq4jvzj7iexnbirelfitv2yvis64f7yhxuoi277r3hagj7ndi
   # Make sure to set the environment to 'local' in your .env file

   # Copy and configure site environment variables
   cp packages/site/.env.development.sample packages/site/.env.development
   # Get the actual values from: https://my.1password.com/app#/gebbq4jvzj7iexnbirelfitv2y/AllItems/gebbq4jvzj7iexnbirelfitv2ywvxnnmeq2y3mkp57zlmirfhrwi
   ```

4. Start the development servers:
   ```bash
   yarn start
   ```
   This will run:
   - Snap server at http://localhost:8080/. For more details, read [packages/snap/README.md](../packages/snap/README.md).
   - Test dapp at http://localhost:3000/. For more details, read [packages/site/README.md](../packages/site/README.md).

## Testing Your Changes

### Setting up MetaMask Flask

1. Locate the directory [`./metamask-extension-overrides`](./metamask-extension-overrides)
2. Copy all files from there to the corresponding locations in your `metamask-extension` repository. Make sure you remove the `.txt` extension from the file name. These overrides are for local development only - do not commit them.
3. Start MetaMask Flask with `yarn:start:flask` in your local `metamask-extension` repository
4. Install the development version in your browser

### Manual Testing

1. Ensure your snap `.env` file is configured with `ENVIRONMENT=local`
2. Start both the snap and test dapp with `yarn start`
3. Make your code changes
4. Wait for the snap to rebuild (you'll see `[@metamask/solana-wallet-snap]: [0] ✔ Done!` in the console)
5. Open the test dapp in your browser at http://localhost:3000/
6. Click the `Reconnect` button to install the locally running snap into MetaMask Flask. This overrides the preinstalled Solana snap.

### Unit Tests

1. Configure your snap `.env` file with `ENVIRONMENT=test`
2. Ensure the snap is running with `yarn start`
3. Run the test suite with `yarn test`

## Contribution Workflow

### Branch Management

- Use the "Create branch" feature in Jira to generate properly named branches
- Branch names should include the ticket ID (e.g., `SOL-10`) and a brief description

### Commit Guidelines

We use `commitlint` to enforce the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format. This helps maintain a clean changelog and consistent commit history.

> [!IMPORTANT]
> Git hooks are configured to automatically:
>
> - Lint your commit messages
> - Fix formatting and linting issues

> [!TIP]
> For a clean changelog, prefer using `feat` and `fix` commit types.

### Pull Requests

To create a successful PR:

1. Ensure all automated checks pass
2. Write a clear and detailed description
3. Link the PR to a Jira ticket (use the "Create branch" feature from Jira)
4. Include appropriate tests for your changes
