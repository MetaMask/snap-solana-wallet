import type { Transaction } from '@metamask/keyring-api';
import { TransactionStatus, TransactionType } from '@metamask/keyring-api';
import type { CaipAssetType } from '@metamask/utils';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import type { IInstruction } from '@solana/kit';
import {
  address as asAddress,
  getBase58Codec,
  lamports,
  type Address,
} from '@solana/kit';
import BigNumber from 'bignumber.js';
import bs58 from 'bs58';
import { get } from 'lodash';

import type { AssetsService, TokenHelper } from '..';
import {
  parseInstruction,
  type InstructionParseResult,
  type InstructionParseSuccess,
  type SolanaKeyringAccount,
} from '../../../entities';
import {
  LAMPORTS_PER_SOL,
  Networks,
  type Network,
} from '../../constants/solana';
import type { SolanaInstruction, SolanaTransaction } from '../../types/solana';
import { lamportsToSol } from '../../utils/conversion';
import type { ILogger } from '../../utils/logger';
import { tokenAddressToCaip19 } from '../../utils/tokenAddressToCaip19';
import type { AssetMetadata } from '../assets/types';

export class TransactionMapper {
  readonly #tokenHelper: TokenHelper;

  readonly #assetsService: AssetsService;

  readonly #logger: ILogger;

  constructor(
    tokenHelper: TokenHelper,
    assetsService: AssetsService,
    logger: ILogger,
  ) {
    this.#tokenHelper = tokenHelper;
    this.#assetsService = assetsService;
    this.#logger = logger;
  }

  /**
   * Maps RPC transaction data to a standardized format.
   * @param transactionData - The raw transaction data from the RPC response.
   * @param account - The account associated with the transaction.
   * @param scope - The network scope (e.g., Mainnet, Devnet).
   * @param assetsMetadata - The assets metadata.
   * @returns The mapped transaction data.
   */
  async mapRpcTransaction(
    transactionData: SolanaTransaction,
    account: SolanaKeyringAccount,
    scope: Network,
    assetsMetadata?: Record<string, AssetMetadata | null>,
  ): Promise<Transaction | null> {
    try {
      const { blockTime } = transactionData;
      const { id: accountId, address } = account;

      const id = transactionData.transaction.signatures[0];
      if (!id) {
        throw new Error('Transaction ID is required');
      }

      const timestamp = Number(blockTime);
      const status = this.#evaluateTransactionStatus(transactionData);

      let fees: Transaction['fees'] = [];
      let nativeFrom: Transaction['from'] = [];
      let nativeTo: Transaction['to'] = [];

      /**
       * If a transaction fails we don't really have access to meaningful `preBalances`
       * and `postBalances` values, since nothing really happened. To extract information
       * from it we have created this second version of the native transfers parser which
       * reads instructions directly, instead of relying on balance differences.
       */
      const parser =
        status === TransactionStatus.Failed
          ? this.#parseTransactionNativeTransfersV2.bind(this)
          : this.#parseTransactionNativeTransfers.bind(this);

      const nativeTransfers = parser({
        scope,
        transactionData,
      });

      fees = nativeTransfers.fees;
      nativeFrom = nativeTransfers.from;
      nativeTo = nativeTransfers.to;

      const { from: splFrom, to: splTo } =
        await this.#parseTransactionSplTransfers({
          scope,
          transactionData,
        });

      let from = [...splFrom, ...nativeFrom];
      let to = [...splTo, ...nativeTo];

      const type = this.#evaluateTransactionType({
        address: asAddress(address),
        status,
        from,
        to,
      });

      if (type === TransactionType.Swap) {
        /**
         * If the type is swap:
         * - we don't want to include assets that were sent by other addresses
         * - we don't want to include assets that were received by other addresses
         * - if there are SPL tokens AND SOL in the from and to arrays, we want to remove the SOL
         */
        from = from.filter((fromItem) => fromItem.address === address);
        to = to.filter((toItem) => toItem.address === address);
      }

      if (type === TransactionType.Receive) {
        /**
         * If the type is receive:
         * - we don't want to include assets that were received by other addresses
         * - we don't want to include fees as they were not paid by the user
         */
        to = to.filter((toItem) => toItem.address === address);
        fees = [];
      }

      const caip19Ids = [
        ...new Set(
          [...from, ...to]
            .filter((item) => item.asset?.fungible)
            .map((item) => (item.asset as { type: CaipAssetType }).type),
        ),
      ];

      const assetsMetadataToUse =
        assetsMetadata ??
        (await this.#assetsService.getAssetsMetadata(caip19Ids));

      from.forEach((item) => {
        if (item.asset?.fungible && assetsMetadataToUse[item.asset.type]) {
          item.asset.unit =
            assetsMetadataToUse[item.asset.type]?.symbol ?? 'UNKNOWN';
        }
      });

      to.forEach((item) => {
        if (item.asset?.fungible && assetsMetadataToUse[item.asset.type]) {
          item.asset.unit =
            assetsMetadataToUse[item.asset.type]?.symbol ?? 'UNKNOWN';
        }
      });

      return {
        id,
        account: accountId,
        timestamp,
        chain: scope as `${string}:${string}`,
        status,
        type,
        from,
        to,
        fees,
        events: [
          {
            status,
            timestamp,
          },
        ],
      };
    } catch (error) {
      this.#logger.warn(error, 'Error mapping transaction');
      return null;
    }
  }

  /**
   * Evaluates the status of a transaction based on the transaction data.
   * @param transactionData - The transaction data.
   * @returns The status of the transaction.
   */
  #evaluateTransactionStatus(
    transactionData: SolanaTransaction,
  ): TransactionStatus {
    const isError =
      transactionData.meta?.err ||
      (transactionData.meta?.status && 'Err' in transactionData.meta.status);

    const status = isError
      ? TransactionStatus.Failed
      : TransactionStatus.Confirmed;

    return status;
  }

  /**
   * Evaluates the type of transaction based on the address and the from and to items.
   * @param params - The options object.
   * @param params.address - The address of the user.
   * @param params.from - The from items.
   * @param params.to - The to items.
   * @param params.status - The status of the transaction.
   * @returns The type of transaction.
   */
  #evaluateTransactionType({
    address,
    status,
    from,
    to,
  }: {
    address: Address;
    status: TransactionStatus;
    from: Transaction['from'];
    to: Transaction['to'];
  }): TransactionType {
    if (
      from.length === 0 ||
      to.length === 0 ||
      status === TransactionStatus.Failed
    ) {
      return TransactionType.Unknown;
    }

    const userSentItems = from.filter(
      (fromItem) => fromItem.address === address,
    );
    const userReceivedItems = to.filter((toItem) => toItem.address === address);

    const isAddressSender = userSentItems.length > 0;
    const isAddressReceiver = userReceivedItems.length > 0;

    const allSentItemsAreToSelf = from.every((fromItem) => {
      return to.some(
        (toItem) =>
          toItem.address === address &&
          fromItem.asset?.fungible === true &&
          toItem.asset?.fungible === true &&
          fromItem.asset.type === toItem.asset.type,
      );
    });

    const allReceivedItemsAreFromSelf = to.every((toItem) => {
      return from.some(
        (fromItem) =>
          fromItem.address === address &&
          fromItem.asset?.fungible === true &&
          toItem.asset?.fungible === true &&
          fromItem.asset.type === toItem.asset.type,
      );
    });

    const isSelfTransfer = allSentItemsAreToSelf && allReceivedItemsAreFromSelf;

    if (isSelfTransfer) {
      return TransactionType.Send;
    }

    if (isAddressSender && isAddressReceiver) {
      return TransactionType.Swap;
    }

    if (isAddressSender) {
      return TransactionType.Send;
    }

    return TransactionType.Receive;
  }

  /**
   * Parses native SOL token transfers from a transaction using its balance changes.
   * @param options0 - The options object.
   * @param options0.scope - The network scope (e.g., Mainnet, Devnet).
   * @param options0.transactionData - The raw transaction data containing balance changes.
   * @returns Transaction details.
   */
  #parseTransactionNativeTransfers({
    scope,
    transactionData,
  }: {
    scope: Network;
    transactionData: SolanaTransaction;
  }): {
    fees: Transaction['fees'];
    from: Transaction['from'];
    to: Transaction['to'];
  } {
    const fees = this.#parseTransactionFees({
      scope,
      transactionData,
    });

    const from: Transaction['from'] = [];
    const to: Transaction['to'] = [];

    const preBalances = new Map(
      transactionData.meta?.preBalances?.map((balance, index) => [
        index,
        new BigNumber(balance.toString()),
      ]) ?? [],
    );

    const postBalances = new Map(
      transactionData.meta?.postBalances?.map((balance, index) => [
        index,
        new BigNumber(balance.toString()),
      ]) ?? [],
    );

    /**
     * The indexes of accounts can be higher than account keys. Don't forget `loadedAddresses`!
     * https://solana.stackexchange.com/questions/11981/the-account-index-does-not-exist-in-accountkeys
     */
    const allAccountAddresses = [
      ...transactionData.transaction.message.accountKeys,
      ...(transactionData.meta?.loadedAddresses?.writable ?? []),
      ...(transactionData.meta?.loadedAddresses?.readonly ?? []),
    ];

    /**
     * Track all accounts that had SOL balance changes
     */
    const allAccountIndexes = new Set([
      ...Array.from(preBalances.keys()),
      ...Array.from(postBalances.keys()),
    ]);

    for (const accountIndex of allAccountIndexes) {
      const address = allAccountAddresses[accountIndex]?.toString();

      if (!address) {
        continue;
      }

      const preBalance = preBalances.get(accountIndex) ?? new BigNumber(0);
      const postBalance = postBalances.get(accountIndex) ?? new BigNumber(0);

      // Account 0 is the fee payer
      const paidFeesSol =
        accountIndex === 0
          ? lamportsToSol(transactionData.meta?.fee ?? 0)
          : new BigNumber(0);

      /**
       * Calculate the delta between the balances and convert from lamports to SOL.
       */
      const balanceDiffSol = preBalance
        .minus(postBalance)
        .dividedBy(new BigNumber(LAMPORTS_PER_SOL))
        .minus(paidFeesSol);

      if (balanceDiffSol.isZero()) {
        continue;
      }

      const amount = balanceDiffSol.absoluteValue().toString();

      /**
       * If the pre-balance is greater than the post-balance, it means that the account
       * has lost SOL, so it's a sender.
       */
      if (preBalance.isGreaterThan(postBalance)) {
        from.push({
          address,
          asset: {
            fungible: true,
            type: Networks[scope].nativeToken.caip19Id,
            unit: Networks[scope].nativeToken.symbol,
            amount,
          },
        });
      }

      /**
       * If the pre-balance is less than the post-balance, it means that the account
       * has gained SOL, so it's a receiver.
       */
      if (preBalance.isLessThan(postBalance)) {
        to.push({
          address,
          asset: {
            fungible: true,
            type: Networks[scope].nativeToken.caip19Id,
            unit: Networks[scope].nativeToken.symbol,
            amount,
          },
        });
      }
    }

    /**
     * And now we check if there are any native transfers to the same address.
     */
    const nativeTransfersToSelf = this.#parseTransactionNativeTransfersToSelf({
      scope,
      transactionData,
    });

    if (nativeTransfersToSelf.from.length > 0) {
      from.push(...nativeTransfersToSelf.from);
    }

    if (nativeTransfersToSelf.to.length > 0) {
      to.push(...nativeTransfersToSelf.to);
    }

    return { fees, from, to };
  }

  /**
   * Parses native SOL token transfers from a transaction using its instructions.
   * @param options0 - The options object.
   * @param options0.scope - The network scope (e.g., Mainnet, Devnet).
   * @param options0.transactionData - The raw transaction data containing balance changes.
   * @returns Transaction details.
   */
  #parseTransactionNativeTransfersV2({
    scope,
    transactionData,
  }: {
    scope: Network;
    transactionData: SolanaTransaction;
  }): {
    fees: Transaction['fees'];
    from: Transaction['from'];
    to: Transaction['to'];
  } {
    const fees = this.#parseTransactionFees({
      scope,
      transactionData,
    });

    const allAccountAddresses = [
      ...transactionData.transaction.message.accountKeys,
      ...(transactionData.meta?.loadedAddresses?.writable ?? []),
      ...(transactionData.meta?.loadedAddresses?.readonly ?? []),
    ];

    const fromMovements: Transaction['from'] = [];
    const toMovements: Transaction['to'] = [];

    /**
     * For V2 let's go through the instructions and see if there are any native transfers.
     */
    const { instructions } = transactionData.transaction.message;

    instructions.forEach((instruction) => {
      const { accounts, data, programIdIndex } = instruction;

      const programAddress = allAccountAddresses[programIdIndex];

      if (programAddress !== SYSTEM_PROGRAM_ADDRESS) {
        return;
      }

      const [fromAccountIndex, toAccountIndex] = accounts;

      if (fromAccountIndex === undefined || toAccountIndex === undefined) {
        return;
      }

      const fromAddress = allAccountAddresses[fromAccountIndex];
      const toAddress = allAccountAddresses[toAccountIndex];

      if (!fromAddress || !toAddress) {
        return;
      }

      const decodedData = bs58.decode(data);
      const opcode = this.#decodeOpcode(decodedData);

      if (opcode !== 2) {
        /**
         * Not a Transfer instruction
         */
        return;
      }

      const amount = this.#decodeNativeTransferAmount(decodedData);

      fromMovements.push({
        address: fromAddress,
        asset: {
          amount: amount.toString(),
          fungible: true,
          type: Networks[scope].nativeToken.caip19Id,
          unit: Networks[scope].nativeToken.symbol,
        },
      });

      toMovements.push({
        address: toAddress,
        asset: {
          amount: amount.toString(),
          fungible: true,
          type: Networks[scope].nativeToken.caip19Id,
          unit: Networks[scope].nativeToken.symbol,
        },
      });
    });

    /**
     * Now we want to merge transfers to the same address of the same asset (type).
     */
    const from = this.#aggregateSameAssetMovements(fromMovements);
    const to = this.#aggregateSameAssetMovements(toMovements);

    return {
      fees,
      from,
      to,
    };
  }

  /**
   * There are some transactions that are sent from the same address to itself.
   * When this happens, the function above will not find any differences in the balances
   * and we will not be able to detect the transfer.
   *
   * This function is used to parse those transactions.
   *
   * @param options0 - The options object.
   * @param options0.scope - The network scope (e.g., Mainnet, Devnet).
   * @param options0.transactionData - The raw transaction data containing token balance changes.
   * @returns Transaction transfer details.
   */
  #parseTransactionNativeTransfersToSelf({
    scope,
    transactionData,
  }: {
    scope: Network;
    transactionData: SolanaTransaction;
  }): {
    from: Transaction['from'];
    to: Transaction['to'];
  } {
    const { instructions } = transactionData.transaction.message;

    const from: Transaction['from'] = [];
    const to: Transaction['to'] = [];

    const systemProgramAccountIndex =
      transactionData.transaction.message.accountKeys.findIndex(
        (account) => account === SYSTEM_PROGRAM_ADDRESS,
      );

    /**
     * If there are no System Program instructions, then we have no native transfers.
     */
    if (systemProgramAccountIndex === -1) {
      return {
        from,
        to,
      };
    }

    instructions.forEach((instruction) => {
      const { accounts, data, programIdIndex } = instruction;

      if (programIdIndex !== systemProgramAccountIndex) {
        return;
      }

      const [fromAccountIndex, toAccountIndex] = accounts;

      if (
        fromAccountIndex === undefined ||
        toAccountIndex === undefined ||
        fromAccountIndex !== toAccountIndex
      ) {
        return;
      }

      const fromAddress =
        transactionData.transaction.message.accountKeys[fromAccountIndex];
      const toAddress =
        transactionData.transaction.message.accountKeys[toAccountIndex];

      if (!fromAddress || !toAddress || fromAddress !== toAddress) {
        return;
      }

      const amount = this.#decodeNativeTransferAmount(bs58.decode(data));

      from.push({
        address: fromAddress,
        asset: {
          amount: amount.toString(),
          fungible: true,
          type: Networks[scope].nativeToken.caip19Id,
          unit: Networks[scope].nativeToken.symbol,
        },
      });

      to.push({
        address: toAddress,
        asset: {
          amount: amount.toString(),
          fungible: true,
          type: Networks[scope].nativeToken.caip19Id,
          unit: Networks[scope].nativeToken.symbol,
        },
      });
    });

    return {
      from,
      to,
    };
  }

  /**
   * Parses SPL token transfers from a transaction data object.
   * @param options0 - The options object.
   * @param options0.scope - The network scope (e.g., Mainnet, Devnet).
   * @param options0.transactionData - The raw transaction data containing token balance changes.
   * @returns Transaction transfer details.
   */
  async #parseTransactionSplTransfers({
    scope,
    transactionData,
  }: {
    scope: Network;
    transactionData: SolanaTransaction;
  }): Promise<{
    from: Transaction['from'];
    to: Transaction['to'];
  }> {
    const from: Transaction['from'] = [];
    const to: Transaction['to'] = [];

    const preBalances = new Map(
      transactionData.meta?.preTokenBalances?.map((balance) => [
        balance.accountIndex,
        new BigNumber(balance.uiTokenAmount.amount),
      ]) ?? [],
    );

    const postBalances = new Map(
      transactionData.meta?.postTokenBalances?.map((balance) => [
        balance.accountIndex,
        new BigNumber(balance.uiTokenAmount.amount),
      ]) ?? [],
    );

    // Track all accounts that had token balance changes
    const allAccountIndexes = new Set([
      ...(transactionData.meta?.preTokenBalances?.map((b) => b.accountIndex) ??
        []),
      ...(transactionData.meta?.postTokenBalances?.map((b) => b.accountIndex) ??
        []),
    ]);

    for (const accountIndex of allAccountIndexes) {
      const preBalance = preBalances.get(accountIndex) ?? new BigNumber(0);
      const postBalance = postBalances.get(accountIndex) ?? new BigNumber(0);
      const balanceDiff = postBalance.minus(preBalance);

      if (balanceDiff.isZero()) {
        continue;
      }

      const tokenDetails =
        transactionData.meta?.preTokenBalances?.find(
          (b) => b.accountIndex === accountIndex,
        ) ??
        transactionData.meta?.postTokenBalances?.find(
          (b) => b.accountIndex === accountIndex,
        );

      if (!tokenDetails) {
        continue;
      }

      const { mint, owner } = tokenDetails;
      if (!owner) {
        continue;
      }

      const caip19Id = tokenAddressToCaip19(scope, mint);

      // Convert the raw amount to the ui amount, taking into account the multiplier if any
      const rawAmount = balanceDiff.absoluteValue().toString();
      const uiAmount = (
        await this.#tokenHelper.amountToUiAmountForMint(
          mint,
          scope,
          lamports(BigInt(rawAmount)),
        )
      ).toString();

      if (balanceDiff.isNegative()) {
        from.push({
          address: owner,
          asset: {
            fungible: true,
            type: caip19Id,
            unit: '', // This will get overwritten by the token metadata when we fetch it
            amount: uiAmount,
          },
        });
      }

      if (balanceDiff.isPositive()) {
        to.push({
          address: owner,
          asset: {
            fungible: true,
            type: caip19Id,
            unit: '', // This will get overwritten by the token metadata when we fetch it
            amount: uiAmount,
          },
        });
      }
    }

    // And now we check if there are any transfers to the same address.
    const transfersToSelf = this.#parseTransactionSplTransfersToSelf({
      scope,
      transactionData,
    });

    if (transfersToSelf.from.length > 0) {
      from.push(...transfersToSelf.from);
    }

    if (transfersToSelf.to.length > 0) {
      to.push(...transfersToSelf.to);
    }

    return { from, to };
  }

  /**
   * Parses SPL token transfers where the sender and receiver are the same address.
   * @param options0 - The options object.
   * @param options0.scope - The network scope (e.g., Mainnet, Devnet).
   * @param options0.transactionData - The raw transaction data containing token balance changes.
   * @returns Transaction transfer details.
   */
  #parseTransactionSplTransfersToSelf({
    scope,
    transactionData,
  }: {
    scope: Network;
    transactionData: SolanaTransaction;
  }): { from: Transaction['from']; to: Transaction['to'] } {
    const { instructions } = transactionData.transaction.message;

    const from: Transaction['from'] = [];
    const to: Transaction['to'] = [];

    // Convert, parse, and filter instructions to only keep self transfers
    const selfTransferInstructions = instructions
      .map((instruction) => this.#toIInstruction(instruction, transactionData))
      .map(parseInstruction)
      .filter(this.#isSelfTransfer.bind(this));

    // For each self transfer, populate the `from` and `to` arrays
    selfTransferInstructions.forEach((instruction) => {
      const authority = get(instruction, 'parsed.accounts.authority.address');
      const source = get(instruction, 'parsed.accounts.source.address');

      if (!authority || !source) {
        return;
      }

      // Reverse lookup the account index of the source address
      const sourceAccountIndex =
        transactionData.transaction.message.accountKeys.indexOf(
          asAddress(source),
        );

      // Grab the `mint` and `decimals` from preTokenBalances
      const { mint, uiTokenAmount: { decimals } = {} } =
        transactionData.meta?.preTokenBalances?.find(
          (b) => b.accountIndex === sourceAccountIndex,
        ) ?? {};

      if (!mint || decimals === undefined) {
        return;
      }

      // Compute the amount of the transfer
      const rawAmount = instruction.parsed?.data.amount;
      const amount = BigNumber(rawAmount)
        .dividedBy(new BigNumber(10).pow(decimals))
        .toString();

      // Convert the mint address to a CAIP-19 ID
      const caip19Id = tokenAddressToCaip19(scope, mint);

      from.push({
        address: authority,
        asset: {
          amount,
          fungible: true,
          type: caip19Id,
          unit: '',
        },
      });

      to.push({
        address: authority,
        asset: {
          amount,
          fungible: true,
          type: caip19Id,
          unit: '',
        },
      });
    });

    return {
      from,
      to,
    };
  }

  /**
   * Parses transaction fees from RPC transaction data.
   * @param params - The options object.
   * @param params.scope - The network scope (e.g., Mainnet, Devnet).
   * @param params.transactionData - The raw transaction data containing fee information.
   * @returns The parsed fee information including the fee amount in lamports.
   */
  #parseTransactionFees({
    scope,
    transactionData,
  }: {
    scope: Network;
    transactionData: SolanaTransaction;
  }): Transaction['fees'] {
    const totalFee = this.#getTransactionTotalFee(transactionData);
    const baseFee = this.#getBaseFee(transactionData);
    const priorityFee = totalFee.minus(baseFee);

    const fees: Transaction['fees'] = [
      {
        type: 'base',
        asset: {
          fungible: true,
          type: Networks[scope].nativeToken.caip19Id,
          unit: Networks[scope].nativeToken.symbol,
          amount: baseFee.toString(),
        },
      },
    ];

    if (priorityFee?.isGreaterThan(0)) {
      fees.push({
        type: 'priority',
        asset: {
          fungible: true,
          type: Networks[scope].nativeToken.caip19Id,
          unit: Networks[scope].nativeToken.symbol,
          amount: priorityFee.toString(),
        },
      });
    }

    return fees;
  }

  /**
   * Parses the total fee from transaction data.
   * @param transactionData - The raw transaction data.
   * @returns The total fee in lamports.
   */
  #getTransactionTotalFee(transactionData: SolanaTransaction): BigNumber {
    const feeLamports = new BigNumber(
      transactionData.meta?.fee?.toString() ?? '0',
    );
    const feeAmount = feeLamports.dividedBy(LAMPORTS_PER_SOL);
    return feeAmount;
  }

  /**
   * Calculates the base fee for a transaction.
   * @param transactionData - The raw transaction data.
   * @returns The base fee in lamports.
   */
  #getBaseFee(transactionData: SolanaTransaction): BigNumber {
    const numberOfSignatures = transactionData.transaction.signatures.length;
    return BigNumber(5000)
      .dividedBy(LAMPORTS_PER_SOL)
      .multipliedBy(numberOfSignatures);
  }

  /**
   * Aggregates movements with the same asset type for the same address.
   *
   * So two movements like this:
   * ```
   * [{
   *   address: '0x1',
   *   asset: {
   *     amount: '50',
   *     fungible: true,
   *     type: 'solana:1',
   *     unit: 'SOL',
   *   },
   * }, {
   *   address: '0x1',
   *   asset: {
   *     amount: '150',
   *     fungible: true,
   *     type: 'solana:1',
   *     unit: 'SOL',
   *   },
   * }]
   * ```
   *
   * will become
   *
   * ```
   * [{
   *   address: '0x1',
   *   asset: {
   *     amount: '200',
   *     fungible: true,
   *     type: 'solana:1',
   *     unit: 'SOL',
   *   },
   * }]
   * ```
   * @param movements - The movements to aggregate.
   * @returns The aggregated movements.
   */
  #aggregateSameAssetMovements(
    movements: Transaction['from'] | Transaction['to'],
  ) {
    return movements.reduce<Transaction['from'] | Transaction['to']>(
      (acc, movement) => {
        // Find existing movement with same asset type
        const existingMovement = acc.find((item) => {
          // Make sure both assets are fungible and have the same type
          return (
            item?.asset?.fungible === true &&
            movement.asset?.fungible === true &&
            item.asset.type === movement.asset.type &&
            item.address === movement.address
          );
        });

        if (
          existingMovement &&
          existingMovement.asset?.fungible === true &&
          movement.asset?.fungible === true
        ) {
          // Convert string amount to BigNumber, add values, then convert back to string
          const existingAmount = new BigNumber(existingMovement.asset.amount);
          const newAmount = existingAmount.plus(movement.asset.amount);
          existingMovement.asset.amount = newAmount.toString();
        } else {
          acc.push(movement);
        }

        return acc;
      },
      [],
    );
  }

  /**
   * Decodes the amount from the instruction data.
   * @param data - The instruction data.
   * @returns The amount.
   */
  #decodeOpcode(data: Uint8Array) {
    /**
     * Opcode is the first 4 bytes of the instruction data.
     */
    let raw = BigInt(0);
    for (let i = 0; i < 4; i++) {
      // eslint-disable-next-line no-bitwise
      raw |= BigInt(data[i] ?? 0) << BigInt(8 * i);
    }

    return Number(raw);
  }

  /**
   * Decodes the amount from the instruction data.
   * @param data - The instruction data.
   * @returns The amount.
   */
  #decodeNativeTransferAmount(data: Uint8Array): BigNumber {
    /**
     * Native Solana transfers have a fixed length of 12 bytes.
     * 4 bytes - Instruction index
     * 8 bytes - Transfer amount unsigned int 64
     */
    let raw = BigInt(0);
    for (let i = 4; i < 12; i++) {
      // eslint-disable-next-line no-bitwise
      raw |= BigInt(data[i] ?? 0) << BigInt(8 * (i - 4));
    }

    return BigNumber(raw.toString()).dividedBy(LAMPORTS_PER_SOL);
  }

  /**
   * Converts a SolanaInstruction to an IInstruction that we can parse with `parseInstruction`
   * @param instruction - The Solana instruction to convert.
   * @param transactionData - The full transaction data.
   * @returns The IInstruction.
   */
  #toIInstruction(
    instruction: SolanaInstruction,
    transactionData: SolanaTransaction,
  ): IInstruction {
    // Filter to only keep the account indexes available in the `accountKeys`
    const isInAccountKeys = (accountIndex: number) =>
      accountIndex < transactionData.transaction.message.accountKeys.length;

    // Build the accounts array
    const accounts = instruction.accounts
      .filter(isInAccountKeys)
      .map((accountIndex) => ({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        address: transactionData.transaction.message.accountKeys[accountIndex]!, // The non-null assertion is safe because we filtered the indexes above
        role: 0,
      }));

    const programAddress =
      transactionData.transaction.message.accountKeys[
        instruction.programIdIndex
      ];

    if (!programAddress) {
      throw new Error('Program address not found');
    }

    // Build the IInstruction object
    const iInstruction = {
      accounts,
      data: getBase58Codec().encode(instruction.data),
      programAddress,
    } as unknown as IInstruction;

    return iInstruction;
  }

  /**
   * Checks if an instruction is a self transfer.
   * @param instruction - The instruction to check.
   * @returns True if the instruction is a self transfer, false otherwise.
   */
  #isSelfTransfer(
    instruction: InstructionParseResult,
  ): instruction is InstructionParseSuccess {
    if (
      instruction.type !== 'Transfer' &&
      instruction.type !== 'TransferChecked'
    ) {
      return false;
    }

    if (!instruction.parsed) {
      return false;
    }

    const { source, destination, authority } =
      instruction.parsed.accounts ?? {};

    if (!source || !destination || !authority) {
      return false;
    }

    return source.address === destination.address;
  }
}
