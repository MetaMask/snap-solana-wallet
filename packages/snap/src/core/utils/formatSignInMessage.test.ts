import type { SolanaSignInRequest } from '../services/wallet/structs';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../test/mocks/solana-keyring-accounts';
import { formatSignInMessage } from './formatSignInMessage';

describe('formatSignInMessage', () => {
  const baseParams: SolanaSignInRequest['params'] = {
    domain: 'example.com',
    address: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
  };

  it('formats basic sign in message with required fields', () => {
    const message = formatSignInMessage(baseParams);
    expect(message).toBe(
      `example.com wants you to sign in with your Solana account:\n` +
        `${MOCK_SOLANA_KEYRING_ACCOUNT_0.address}`,
    );
  });

  it('includes statement when provided', () => {
    const params = {
      ...baseParams,
      statement: 'Please sign in to continue',
    };
    const message = formatSignInMessage(params);
    expect(message).toBe(
      `example.com wants you to sign in with your Solana account:\n` +
        `${MOCK_SOLANA_KEYRING_ACCOUNT_0.address}\n\n` +
        'Please sign in to continue',
    );
  });

  it('includes all optional fields when provided', () => {
    const params = {
      ...baseParams,
      uri: 'https://example.com',
      version: '1',
      chainId: 'mainnet',
      nonce: '123456',
      issuedAt: '2024-01-01T00:00:00Z',
      expirationTime: '2024-01-02T00:00:00Z',
      notBefore: '2024-01-01T00:00:00Z',
      requestId: 'req-123',
      resources: [
        'https://example.com/resource1',
        'https://example.com/resource2',
      ],
    };
    const message = formatSignInMessage(params);
    expect(message).toBe(
      'example.com wants you to sign in with your Solana account:\n' +
        `${MOCK_SOLANA_KEYRING_ACCOUNT_0.address}\n\n` +
        'URI: https://example.com\n' +
        'Version: 1\n' +
        'Chain ID: mainnet\n' +
        'Nonce: 123456\n' +
        'Issued At: 2024-01-01T00:00:00Z\n' +
        'Expiration Time: 2024-01-02T00:00:00Z\n' +
        'Not Before: 2024-01-01T00:00:00Z\n' +
        'Request ID: req-123\n' +
        'Resources:\n' +
        '- https://example.com/resource1\n' +
        '- https://example.com/resource2',
    );
  });

  it('handles empty resources array', () => {
    const params = {
      ...baseParams,
      resources: [],
    };
    const message = formatSignInMessage(params);
    expect(message).toBe(
      'example.com wants you to sign in with your Solana account:\n' +
        `${MOCK_SOLANA_KEYRING_ACCOUNT_0.address}\n\n` +
        'Resources:',
    );
  });

  it('handles undefined optional fields', () => {
    const params = {
      ...baseParams,
      uri: undefined,
      version: undefined,
      chainId: undefined,
      nonce: undefined,
      issuedAt: undefined,
      expirationTime: undefined,
      notBefore: undefined,
      requestId: undefined,
      resources: undefined,
    };
    const message = formatSignInMessage(params);
    expect(message).toBe(
      `example.com wants you to sign in with your Solana account:\n` +
        `${MOCK_SOLANA_KEYRING_ACCOUNT_0.address}`,
    );
  });
});
