## Testing

In order to test snaps, this project uses [`@metamask/snaps-jest`](https://github.com/MetaMask/snaps/tree/main/packages/snaps-jest) which extend the functionality of jest.
Make sure you are familiar with the framework before writting tests.

### Running tests

```bash
# Run tests located under src/core.
yarn test:core

# Run UI / component tests, located under src/features.
# They can't be run in parallel because they share the same mock Solana RPC server, and conflicting mock implementations would lead to flaky tests.
yarn test:features

# Alternatively, you can run all tests. They also can't be run in parallel because of the reasons mentioned above.
yarn test
```

> [!WARNING]  
> Before running `yarn test:xxx` make sure your build the snap first by running `yarn build`. Tests are looking at the built version of the snap.

To run test in watch mode using the following script

```bash
yarn test:core:watch
yarn test:features:watch

# Or all tests
yarn test:watch
```

### Mocking Solana RPC

When testing UI components that trigger calls to the Solana RPC, use the `startMockSolanaRpc` utility function to mock the RPC responses and errors.

> [!WARNING]  
> Read through the [Gotchas](#gotchas) section below to avoid common pitfalls.

```ts
describe('Some UI component', () => {
  let mockSolanaRpc: MockSolanaRpc;

  // ⚠️ WARNING: it's `beforeAll`, and not `beforeEach`
  beforeAll(() => {
    // This starts a mock Solana RPC server on local port 8899
    mockSolanaRpc = startMockSolanaRpc();
  });

  // ⚠️ WARNING: it's `afterAll`, and not `afterEach`
  afterAll(() => {
    mockSolanaRpc.shutdown();
  });

  it('renders properly', async () => {
    const {
      mockResolvedResult,
      mockResolvedResultOnce,
      mockRejectedError,
      mockRejectedErrorOnce,
    } = mockSolanaRpc;

    // This will make the mock Solana RPC return the specified results for subsequent calls with the `getBalance` method.
    mockResolvedResult({ method: 'getBalance', result: { balance: 500 } });

    // It also supports the Jest "once" behavior, where last mocked response will be the first one used (LIFO).
    mockResolvedResultOnce({ method: 'getBalance', result: { balance: 1000 } });
    mockResolvedResultOnce({ method: 'getBalance', result: { balance: 2000 } });

    // Errors can be mocked the same way.
    mockRejectedError({
      method: 'sendTransaction',
      error: { code: -32000, message: 'Insufficient funds' },
    });

    mockRejectedErrorOnce({
      method: 'getLatestBlockhash',
      error: { code: -32000, message: 'Failed to get latest blockhash' },
    });
  });
});
```

#### Gotchas

- The `startMockSolanaRpc` function runs an Express server on **fixed** port 8899, meaning that you cannot run multiple instances of it at the same time. We cannot allocate a random port because the snap doesn't know about the RPC URL or the port. It only receive the `scope` as a request parameter, and the mapping `scope` to `URL` is defined statically.
- The `shutdown` function must be called in the `afterEach` hook to cleanly stop the mock server.
- Parallel tests that mock the **same** RPC method will interfere with each other because the mock server state is shared across tests.
