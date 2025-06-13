/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable jest/require-to-throw-message */
import type { Transaction } from '@metamask/keyring-api';

import { Network } from '../../constants/solana';
import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../test/mocks/solana-keyring-accounts';
import logger from '../../utils/logger';
import { AnalyticsService } from './AnalyticsService';

const mockSnapRequest = jest.fn();
const snap = {
  request: mockSnapRequest,
};
(globalThis as any).snap = snap;

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let loggerSpy: jest.SpyInstance;

  const mockAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;
  const mockBase64Transaction = 'dGVzdCB0cmFuc2FjdGlvbiBkYXRh';
  const mockScope = Network.Mainnet;
  const mockOrigin = 'https://metamask.io';
  const mockSignature = 'mockedSignature';
  const mockMetadata = {
    scope: mockScope,
    origin: mockOrigin,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsService = new AnalyticsService();
    loggerSpy = jest.spyOn(logger, 'log').mockImplementation();
    mockSnapRequest.mockResolvedValue(undefined);
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  describe('trackEventTransactionAdded', () => {
    it('tracks transaction added event with origin', async () => {
      await analyticsService.trackEventTransactionAdded(
        mockAccount,
        mockBase64Transaction,
        mockMetadata,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        '[📣 AnalyticsService] Tracking event transaction added',
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Added',
            properties: {
              message: 'Snap transaction added',
              origin: mockOrigin,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockScope,
            },
          },
        },
      });
    });

    it('tracks transaction added event without origin', async () => {
      await analyticsService.trackEventTransactionAdded(
        mockAccount,
        mockBase64Transaction,
        mockMetadata,
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Added',
            properties: {
              message: 'Snap transaction added',
              origin: null,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockScope,
            },
          },
        },
      });
    });

    it('throws error for invalid base64 transaction', async () => {
      const invalidBase64 = 'invalid-base64!@#';

      await expect(
        analyticsService.trackEventTransactionAdded(
          mockAccount,
          invalidBase64,
          mockMetadata,
        ),
      ).rejects.toThrow();
    });
  });

  describe('trackEventTransactionApproved', () => {
    it('tracks transaction approved event with origin', async () => {
      await analyticsService.trackEventTransactionApproved(
        mockAccount,
        mockBase64Transaction,
        mockMetadata,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        '[📣 AnalyticsService] Tracking event transaction approved',
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Approved',
            properties: {
              message: 'Snap transaction approved',
              origin: mockOrigin,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockScope,
            },
          },
        },
      });
    });

    it('tracks transaction approved event without origin', async () => {
      await analyticsService.trackEventTransactionApproved(
        mockAccount,
        mockBase64Transaction,
        mockMetadata,
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Approved',
            properties: {
              message: 'Snap transaction approved',
              origin: null,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockScope,
            },
          },
        },
      });
    });

    it('throws error for invalid base64 transaction', async () => {
      const invalidBase64 = 'invalid-base64!@#';

      await expect(
        analyticsService.trackEventTransactionApproved(
          mockAccount,
          invalidBase64,
          mockMetadata,
        ),
      ).rejects.toThrow();
    });
  });

  describe('trackEventTransactionSubmitted', () => {
    it('tracks transaction submitted event with origin', async () => {
      await analyticsService.trackEventTransactionSubmitted(
        mockAccount,
        mockBase64Transaction,
        mockSignature,
        mockMetadata,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        '[📣 AnalyticsService] Tracking event transaction submitted',
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Submitted',
            properties: {
              message: 'Snap transaction submitted',
              origin: mockOrigin,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockScope,
            },
          },
        },
      });
    });

    it('tracks transaction submitted event without origin', async () => {
      await analyticsService.trackEventTransactionSubmitted(
        mockAccount,
        mockBase64Transaction,
        mockSignature,
        mockMetadata,
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Submitted',
            properties: {
              message: 'Snap transaction submitted',
              origin: null,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockScope,
            },
          },
        },
      });
    });

    it('throws error for invalid base64 transaction', async () => {
      const invalidBase64 = 'invalid-base64!@#';

      await expect(
        analyticsService.trackEventTransactionSubmitted(
          mockAccount,
          invalidBase64,
          mockSignature,
          mockMetadata,
        ),
      ).rejects.toThrow();
    });
  });

  describe('trackEventTransactionFinalized', () => {
    const mockTransaction: Transaction = {
      id: 'mock-transaction-id',
      account: mockAccount.id,
      chain: mockScope,
      status: 'confirmed',
      type: 'send',
      timestamp: 1736500242,
      from: [
        {
          address: mockAccount.address,
          asset: {
            fungible: true,
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            unit: 'SOL',
            amount: '0.1',
          },
        },
      ],
      to: [
        {
          address: '6LfawjK4CQE7pHApWYA6s6PCH5jfgrcRcV6xE6vtiyjY',
          asset: {
            fungible: true,
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            unit: 'SOL',
            amount: '0.1',
          },
        },
      ],
      fees: [
        {
          type: 'base',
          asset: {
            fungible: true,
            type: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            unit: 'SOL',
            amount: '0.000005',
          },
        },
      ],
      events: [
        {
          status: 'confirmed',
          timestamp: 1736500242,
        },
      ],
    };

    it('tracks transaction finalized event with origin', async () => {
      await analyticsService.trackEventTransactionFinalized(
        mockAccount,
        mockTransaction,
        mockMetadata,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        '[📣 AnalyticsService] Tracking event transaction finalized',
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Finalized',
            properties: {
              message: 'Snap transaction finalized',
              origin: mockOrigin,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockTransaction.chain,
              transaction_status: mockTransaction.status,
              transaction_type: mockTransaction.type,
            },
          },
        },
      });
    });

    it('tracks transaction finalized event without origin', async () => {
      await analyticsService.trackEventTransactionFinalized(
        mockAccount,
        mockTransaction,
        mockMetadata,
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Finalized',
            properties: {
              message: 'Snap transaction finalized',
              origin: null,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockTransaction.chain,
              transaction_status: mockTransaction.status,
              transaction_type: mockTransaction.type,
            },
          },
        },
      });
    });
  });

  describe('trackEventTransactionRejected', () => {
    it('tracks transaction rejected event with origin', async () => {
      await analyticsService.trackEventTransactionRejected(
        mockAccount,
        mockBase64Transaction,
        mockMetadata,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        '[📣 AnalyticsService] Tracking event transaction rejected',
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Rejected',
            properties: {
              message: 'Snap transaction rejected',
              origin: mockOrigin,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockScope,
            },
          },
        },
      });
    });

    it('tracks transaction rejected event without origin', async () => {
      await analyticsService.trackEventTransactionRejected(
        mockAccount,
        mockBase64Transaction,
        mockMetadata,
      );

      expect(mockSnapRequest).toHaveBeenCalledWith({
        method: 'snap_trackEvent',
        params: {
          event: {
            event: 'Transaction Rejected',
            properties: {
              message: 'Snap transaction rejected',
              origin: null,
              account_id: mockAccount.id,
              account_address: mockAccount.address,
              account_type: mockAccount.type,
              chain_id: mockScope,
            },
          },
        },
      });
    });

    it('throws error for invalid base64 transaction', async () => {
      const invalidBase64 = 'invalid-base64!@#';

      await expect(
        analyticsService.trackEventTransactionRejected(
          mockAccount,
          invalidBase64,
          mockMetadata,
        ),
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('handles snap.request errors gracefully', async () => {
      const error = new Error('Snap request failed');
      mockSnapRequest.mockRejectedValue(error);

      await expect(
        analyticsService.trackEventTransactionAdded(
          mockAccount,
          mockBase64Transaction,
          mockMetadata,
        ),
      ).rejects.toThrow('Snap request failed');
    });
  });
});
