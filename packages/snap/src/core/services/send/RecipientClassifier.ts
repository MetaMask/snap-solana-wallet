import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import type { Address } from '@solana/kit';
import { assertAccountExists } from '@solana/kit';
import { get } from 'lodash';

import type { Network } from '../../constants/solana';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import type { SolanaConnection } from '../connection';

export type RecipientClassification =
  | { type: 'SYSTEM' } // System account (wallet)
  | {
      type: 'TOKEN_ACCOUNT';
      mint: Address;
    }
  | { type: 'UNSUPPORTED' }; // PDA, metadata, program account, mint, etc.

/**
 * Determines how a recipient address should be handled when sending SPL tokens.
 *
 * This classifier protects users from accidental fund loss if they enter addresses that are not standard wallet addresses,
 * such as token accounts, mints, or program accounts, in the recipient field.
 *
 * Typically, users provide a wallet (system account) address as the recipient.
 * However, it's possible to enter a token account, a mint, or a program-derived address by mistake.
 *
 * If the address is a token account, the system detects this and transparently adapts the send flow.
 *
 * The classifier distinguishes among:
 * - System account (wallet): sends to the user's main address, via token accounts, created if necessary.
 * - Token account: sends directly to the token account.
 * - Unsupported account types (PDA, program, mint): rejects the operation.
 */
export class RecipientClassifier {
  readonly #connection: SolanaConnection;

  readonly #logger: ILogger;

  constructor(connection: SolanaConnection, logger: ILogger) {
    this.#connection = connection;
    this.#logger = createPrefixedLogger(logger, '[👀 RecipientClassifier]');
  }

  async classify(
    recipientAddress: string,
    network: Network,
  ): Promise<RecipientClassification> {
    this.#logger.info('Classifying recipient', { recipientAddress, network });

    // Fetch the recipient account info
    const recipientInfo = await this.#connection.fetchJsonParsedAccount(
      recipientAddress,
      network,
    );

    try {
      assertAccountExists(recipientInfo);
    } catch (error) {
      // The account doesn't exist yet. The blockchain will create it as a system account.
      return { type: 'SYSTEM' };
    }

    const { programAddress: recipientProgramAddress } = recipientInfo;

    if (recipientProgramAddress === SYSTEM_PROGRAM_ADDRESS) {
      // It's a system account (wallet)
      return { type: 'SYSTEM' };
    }

    const recipientMint = get(recipientInfo, 'data.mint');
    const recipientAuthority = get(recipientInfo, 'data.owner');

    if (
      (recipientProgramAddress === TOKEN_PROGRAM_ADDRESS ||
        recipientProgramAddress === TOKEN_2022_PROGRAM_ADDRESS) &&
      recipientMint &&
      recipientAuthority
    ) {
      // It's a token account
      return {
        type: 'TOKEN_ACCOUNT',
        mint: recipientMint,
      };
    }

    // Anything else is likely a mint account, program data account, metadata, PDA, etc.
    return { type: 'UNSUPPORTED' };
  }
}
