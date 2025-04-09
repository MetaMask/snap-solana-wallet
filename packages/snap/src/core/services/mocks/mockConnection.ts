import type { SolanaConnection } from '../connection/SolanaConnection';
import {
  MOCK_SOLANA_RPC_GET_BALANCE_AS_SDK_RESPONSE,
  MOCK_SOLANA_RPC_GET_LATEST_BLOCKHASH_AS_SDK_RESPONSE,
  MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_AS_SDK_RESPONSE,
  MOCK_SOLANA_RPC_GET_TRANSACTION_RESPONSE,
  MOCK_SOLANA_RPC_SEND_TRANSACTION_RESPONSE,
} from './mockSolanaRpcResponses';

const createMockGetBalance = () =>
  jest.fn().mockReturnValue({
    send: jest
      .fn()
      .mockReturnValue(MOCK_SOLANA_RPC_GET_BALANCE_AS_SDK_RESPONSE),
  });

const createMockGetLatestBlockhash = () =>
  jest.fn().mockReturnValue({
    send: jest
      .fn()
      .mockReturnValue(MOCK_SOLANA_RPC_GET_LATEST_BLOCKHASH_AS_SDK_RESPONSE),
  });

const createMockSendTransaction = () =>
  jest.fn().mockReturnValue({
    send: jest
      .fn()
      .mockReturnValue(MOCK_SOLANA_RPC_SEND_TRANSACTION_RESPONSE.result),
  });

const createMockGetSignaturesForAddress = () =>
  jest.fn().mockReturnValue({
    send: jest.fn().mockReturnValue([
      {
        signature:
          '3B7H4E2ih3Tcas6um1izEBZagVfLoxSUfZSKkSNSu7mh4nAy7ZafaEgKhH4d1NBY2MMRWgyPX2LcMbKYwphR8dRq',
      },
      {
        signature:
          '3Zj5XkvE1Uec1frjue6SK2ND2cqhKPvPkZ1ZFPwo2v9iL4NX4b4WWG1wPNEQdnJJU8sVx7MMHjSH1HxoR21vEjoV',
      },
      {
        signature:
          '2qfNzGs15dt999rt1AUJ7D1oPQaukMPPmHR2u5ZmDo4cVtr1Pr2Dax4Jo7ryTpM8jxjtXLi5NHy4uyr68MVh5my6',
      },
      {
        signature:
          '54Lz5p2zQNU6ngvyGtpeMYEdGoHG2D7ByPS2n3Wa4QNHzqTZ46sUemk1PxSrM6UieQ2i15XiRrTuxZyiPkg8V1vW',
      },
      {
        signature:
          '2a5UXcyb6Gz8DH5MdumBvoGQiHLjTKfPcKrAGcsPrVSUjM9NRVUB1TuL1sNEj59nKBzfLm3Z2RvtsnCGZHa7KXPB',
      },
      {
        signature:
          'yftYXx1xSmLiMeJ2mGkpZd7Xd13mtW7juWcRnihMhDz1zAeCrq5rPrw7WoCkhEcfUL7MwYCti9Q8bWRdJKZuris',
      },
      {
        signature:
          '24pkWA6oUqtKs1nqx4ZFqW3DoeNcVHC57s1azr63EzaXsDNJAkejmyjB7QonVqvm3cC8cVtbN11jSWTu1xUurQZ9',
      },
      {
        signature:
          '27kCW7f9RCWDkQSqSDrwvbJ3d8mgaFmLLu7GsVujJnp55ue8mQNHvphoVEEF32mXUWZSagdXNraZ7zszBENgAY7T',
      },
      {
        signature:
          '5XpBS9D4bBhc4F69SJd3th19Xe8qhqPyJ3MKWhRLF3tbeHTbSLZSM9UUztJc7pLTASUd2jNR67y2W3Q6LogUnai7',
      },
      {
        signature:
          '5iFQpCwAgiXebzuKxLfhePscR9EYRvRNRSx2Mbj12ed36zNkGmQMkg7ekFXjh88R3p75D6uNK45hgRxC6FyUDnhE',
      },
    ]),
  });

const createMockGetTransaction = () =>
  jest.fn().mockReturnValue({
    send: jest.fn().mockImplementation(({ signature }) => {
      if (
        signature ===
        '3B7H4E2ih3Tcas6um1izEBZagVfLoxSUfZSKkSNSu7mh4nAy7ZafaEgKhH4d1NBY2MMRWgyPX2LcMbKYwphR8dRq'
      ) {
        return MOCK_SOLANA_RPC_GET_TRANSACTION_RESPONSE.result;
      }

      return null;
    }),
  });

const createMockGetTokenAccountsByOwner = () =>
  jest.fn().mockReturnValue({
    send: jest
      .fn()
      .mockReturnValue(
        MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_AS_SDK_RESPONSE,
      ),
  });

const createMockGetMultipleAccounts = () =>
  jest.fn().mockReturnValue({
    send: jest.fn().mockResolvedValue({ value: [] }),
  });

const createMockGetRpc = () =>
  jest.fn().mockReturnValue({
    getBalance: createMockGetBalance(),
    getTokenAccountsByOwner: createMockGetTokenAccountsByOwner(),
    getLatestBlockhash: createMockGetLatestBlockhash(),
    sendTransaction: createMockSendTransaction(),
    getSignaturesForAddress: createMockGetSignaturesForAddress(),
    getTransaction: createMockGetTransaction(),
    getMultipleAccounts: createMockGetMultipleAccounts(),
  });

export const createMockConnection = (): SolanaConnection =>
  ({
    getRpc: createMockGetRpc(),
  } as unknown as SolanaConnection);
