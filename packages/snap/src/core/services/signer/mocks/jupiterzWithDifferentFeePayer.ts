/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  address,
  blockhash,
  type CompilableTransactionMessage,
} from '@solana/kit';

import { Network } from '../../../constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_0,
  MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES,
} from '../../../test/mocks/solana-keyring-accounts';

const scope = Network.Devnet;

const userAccount = MOCK_SOLANA_KEYRING_ACCOUNT_0;

const fromAccountPrivateKeyBytes =
  MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES[userAccount.id]!;

const transactionRequestBase64Encoded =
  'AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAIABgymr6yEAmkOIXpp3AcyvWL/QB2KoDZDEZAXeMYvfP7cvZmwAo+dnq8yhuKR7QpXgj+5yPFMzVwViEudWE9Z+N90DiUHiMuOTEfv/7RvoyR8p3lT/6Mq87vOJ1wZbQZg8PAPZvgVNXGQR4l/GibNBPjRJtllQ2kqGDcrpjCUaFKkdTAkgVB1V0ZN+ftspt1cSBk+wVMQVrs4JNQFQwBgW9GZhOywRahqdvSkj2/cQCplpD9GCV8x5MAdCkD4ANfRnpsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAABpuIV/6rgYT7aH9jRhjANdrEOdwa6ztVmKDwAAAAAAEG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqUpYSftyo7vpH9xbDmpX9jxaHLRbIGem7Qys02OVyKECxvp6877brTo9ZfNqq8l0MbG75MLS9uDkfKYCA0UvXWFz0a9nDKqpPdiAVLKedeH/FiXhKfcaZRxRu5EmDTJBAAMHAAkDOSkAAAAAAAAHAAUCfpAAAAoMAQAFAwoCCwkICQYEI6hgt6NcCiigQEIPAAAAAACXWkUAAAAAABSa0mgAAAAAAgAAAA==';

const transactionMessage: CompilableTransactionMessage = {
  instructions: [
    {
      programAddress: address('ComputeBudget111111111111111111111111111111'),
      data: new Uint8Array([3, 57, 41, 0, 0, 0, 0, 0, 0]),
    },
    {
      programAddress: address('ComputeBudget111111111111111111111111111111'),
      data: new Uint8Array([2, 126, 144, 0, 0]),
    },
    {
      programAddress: address('61DFfeTKM7trxYcPQCM78bJ794ddZprZpAwAnLiwTpYH'),
      accounts: [
        { address: address(userAccount.address), role: 3 },
        {
          address: address('CDg3bPoM21fSXEzrXWHWyJR33JHX6xaYboq5p7s4uo48'),
          role: 3,
        },
        {
          address: address('9wt9PfjPD3JCy5r7o4K1cTGiuTG7fq2pQhdDCdQALKjg'),
          role: 1,
        },
        {
          address: address('238BYhc1qz4S62GBFGhFm3233PC9S6dmhtikjzKendsz'),
          role: 1,
        },
        {
          address: address('61DFfeTKM7trxYcPQCM78bJ794ddZprZpAwAnLiwTpYH'),
          role: 0,
        },
        {
          address: address('xDTVdH7CGuDhRebhtfSxE33ZL1crUKwM3GnSb9a7DKm'),
          role: 1,
        },
        {
          address: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
          role: 0,
        },
        {
          address: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          role: 0,
        },
        {
          address: address('So11111111111111111111111111111111111111112'),
          role: 0,
        },
        {
          address: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          role: 0,
        },
        { address: address('11111111111111111111111111111111'), role: 0 },
        {
          address: address('4EvracGAstedg3H7oTkERRshLvQ7hwKjSc9BuWgegFjN'),
          role: 1,
        },
      ],
      data: new Uint8Array([
        168, 96, 183, 163, 92, 10, 40, 160, 64, 66, 15, 0, 0, 0, 0, 0, 151, 90,
        69, 0, 0, 0, 0, 0, 20, 154, 210, 104, 0, 0, 0, 0, 2, 0, 0,
      ]),
    },
  ],
  version: 0,
  feePayer: {
    address: address('CDg3bPoM21fSXEzrXWHWyJR33JHX6xaYboq5p7s4uo48'), // Note that this is NOT the user address
  },
  lifetimeConstraint: {
    blockhash: blockhash('8o7LFQ8aJ1eZkB1ShjnwzwnfkptjbRoD8gXPkib7K1DR'),
    lastValidBlockHeight: 18446744073709551615n,
  },
};

export const MOCK_SIGN_SCENARIO_JUPITERZ_WITH_DIFFERENT_FEE_PAYER = {
  scope,
  userAccount,
  fromAccountPrivateKeyBytes,
  transactionRequestBase64Encoded,
  transactionMessage,
};
