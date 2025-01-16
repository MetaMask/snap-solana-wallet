import { address as asAddress } from '@solana/web3.js';

import { TokenMetadataClient } from '../../clients/token-metadata-client/TokenMetadataClient';
import { Network } from '../../constants/solana';
import type { MockSolanaRpc } from '../../test/mocks/startMockSolanaRpc';
import { startMockSolanaRpc } from '../../test/mocks/startMockSolanaRpc';
import { MOCK_GET_SIGNATURES_FOR_ADDRESS } from '../../test/mocks/transactions';
import { ConfigProvider } from '../config';
import { SolanaConnection } from '../connection/SolanaConnection';
import { mockLogger } from '../mocks/logger';
import { TokenMetadataService } from '../token-metadata/TokenMetadata';
import { TransactionsService } from './Transactions';

describe('TransactionsService', () => {
  let mockSolanaRpc: MockSolanaRpc;
  let service: TransactionsService;

  beforeAll(() => {
    mockSolanaRpc = startMockSolanaRpc();
  });

  afterAll(() => {
    mockSolanaRpc.shutdown();
  });

  beforeEach(() => {
    const configProvider = new ConfigProvider();
    const connection = new SolanaConnection(configProvider);
    const tokenMetadataClient = new TokenMetadataClient(configProvider);
    const tokenMetadataService = new TokenMetadataService({
      tokenMetadataClient,
      logger: mockLogger,
    });

    service = new TransactionsService({
      configProvider,
      connection,
      logger: mockLogger,
      tokenMetadataService,
    });
  });

  describe('fetchLatestSignatures', () => {
    it('should fetch and return signatures for the given address', async () => {
      const { mockResolvedResultOnce } = mockSolanaRpc;

      mockResolvedResultOnce({
        method: 'getSignaturesForAddress',
        result: MOCK_GET_SIGNATURES_FOR_ADDRESS,
      });

      const result = await service.fetchLatestSignatures(
        Network.Localnet,
        asAddress('BLw3RweJmfbTapJRgnPRvd962YDjFYAnVGd1p5hmZ5tP'),
        10,
      );

      expect(result).toStrictEqual([
        '3B7H4E2ih3Tcas6um1izEBZagVfLoxSUfZSKkSNSu7mh4nAy7ZafaEgKhH4d1NBY2MMRWgyPX2LcMbKYwphR8dRq',
        '3Zj5XkvE1Uec1frjue6SK2ND2cqhKPvPkZ1ZFPwo2v9iL4NX4b4WWG1wPNEQdnJJU8sVx7MMHjSH1HxoR21vEjoV',
        '2qfNzGs15dt999rt1AUJ7D1oPQaukMPPmHR2u5ZmDo4cVtr1Pr2Dax4Jo7ryTpM8jxjtXLi5NHy4uyr68MVh5my6',
        '54Lz5p2zQNU6ngvyGtpeMYEdGoHG2D7ByPS2n3Wa4QNHzqTZ46sUemk1PxSrM6UieQ2i15XiRrTuxZyiPkg8V1vW',
        '2a5UXcyb6Gz8DH5MdumBvoGQiHLjTKfPcKrAGcsPrVSUjM9NRVUB1TuL1sNEj59nKBzfLm3Z2RvtsnCGZHa7KXPB',
        'yftYXx1xSmLiMeJ2mGkpZd7Xd13mtW7juWcRnihMhDz1zAeCrq5rPrw7WoCkhEcfUL7MwYCti9Q8bWRdJKZuris',
        '24pkWA6oUqtKs1nqx4ZFqW3DoeNcVHC57s1azr63EzaXsDNJAkejmyjB7QonVqvm3cC8cVtbN11jSWTu1xUurQZ9',
        '27kCW7f9RCWDkQSqSDrwvbJ3d8mgaFmLLu7GsVujJnp55ue8mQNHvphoVEEF32mXUWZSagdXNraZ7zszBENgAY7T',
        '5XpBS9D4bBhc4F69SJd3th19Xe8qhqPyJ3MKWhRLF3tbeHTbSLZSM9UUztJc7pLTASUd2jNR67y2W3Q6LogUnai7',
        '5iFQpCwAgiXebzuKxLfhePscR9EYRvRNRSx2Mbj12ed36zNkGmQMkg7ekFXjh88R3p75D6uNK45hgRxC6FyUDnhE',
      ]);
    });
  });
});
