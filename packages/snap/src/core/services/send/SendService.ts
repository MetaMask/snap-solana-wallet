import type { KeyringRequest } from '@metamask/keyring-api';
import { SolMethod } from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';
import { Duration, parseCaipAssetType } from '@metamask/utils';
import { address as asAddress } from '@solana/kit';
import { BigNumber } from 'bignumber.js';

import { SendFeeCalculator } from '../../../features/send/transactions/SendFeeCalculator';
import type { SendSolBuilder } from '../../../features/send/transactions/SendSolBuilder';
import type { SendSplTokenBuilder } from '../../../features/send/transactions/SendSplTokenBuilder';
import type { ICache } from '../../caching/ICache';
import { useCache } from '../../caching/useCache';
import { METAMASK_ORIGIN, Networks } from '../../constants/solana';
import type { Network } from '../../constants/solana';
import type { SolanaKeyring } from '../../handlers/onKeyringRequest/Keyring';
import { fromCompilableTransactionMessageToBase64String } from '../../sdk-extensions/codecs';
import type { Serializable } from '../../serialization/types';
import { solToLamports } from '../../utils/conversion';
import { createPrefixedLogger, type ILogger } from '../../utils/logger';
import type { AssetsService } from '../assets';
import type { SolanaConnection } from '../connection';
import {
  SendErrorCodes,
  type OnAddressInputRequest,
  type OnAmountInputRequest,
  type OnConfirmSendRequest,
  type ValidationResponse,
} from './types';

export class SendService {
  readonly #connection: SolanaConnection;

  readonly #keyring: SolanaKeyring;

  readonly #logger: ILogger;

  readonly #cache: ICache<Serializable>;

  readonly #sendSolBuilder: SendSolBuilder;

  readonly #sendSplTokenBuilder: SendSplTokenBuilder;

  readonly #assetsService: AssetsService;

  readonly #cacheTtlsMilliseconds = {
    minimumBalanceForRentExemption: 5 * Duration.Minute,
  };

  constructor(
    connection: SolanaConnection,
    keyring: SolanaKeyring,
    logger: ILogger,
    cache: ICache<Serializable>,
    sendSolBuilder: SendSolBuilder,
    sendSplTokenBuilder: SendSplTokenBuilder,
    assetsService: AssetsService,
  ) {
    this.#connection = connection;
    this.#keyring = keyring;
    this.#cache = cache;
    this.#logger = createPrefixedLogger(logger, '[📬 SendService]');
    this.#sendSolBuilder = sendSolBuilder;
    this.#sendSplTokenBuilder = sendSplTokenBuilder;
    this.#assetsService = assetsService;
  }

  async #getCachedMinimumBalanceForRentExemption(
    scope: Network,
  ): Promise<BigNumber> {
    const minimumBalanceForRentExemption = useCache<[Network], BigNumber>(
      async (_scope: Network) =>
        this.#connection
          .getRpc(scope)
          .getMinimumBalanceForRentExemption(BigInt(0))
          .send()
          .then((response) => BigNumber(response.toString())),
      this.#cache,
      {
        functionName: 'SendService:getMinimumBalanceForRentExemption',
        ttlMilliseconds:
          this.#cacheTtlsMilliseconds.minimumBalanceForRentExemption,
        generateCacheKey: (functionName, args) => {
          const [_scope] = args;
          return `${functionName}:${_scope}`;
        },
      },
    );

    return minimumBalanceForRentExemption(scope);
  }

  /**
   * Handles the confirmation of a send transaction.
   *
   * @param request - The JSON-RPC request containing the parameters.
   * @returns The response to the JSON-RPC request.
   * @throws {InvalidParamsError} If the params are invalid.
   */
  async confirmSend(request: OnConfirmSendRequest): Promise<Json> {
    const { fromAccountId, toAddress, amount, assetId } = request.params;

    const account = await this.#keyring.getAccountOrThrow(fromAccountId);

    const { chainId, assetReference } = parseCaipAssetType(assetId);

    const scope = chainId as Network;

    const isNativeSend = assetId === Networks[scope].nativeToken.caip19Id;

    const builder = isNativeSend
      ? this.#sendSolBuilder
      : this.#sendSplTokenBuilder;

    this.#logger.log('Confirming send transaction', {
      fromAccountId,
      toAddress,
      amount,
      assetId,
    });

    const params = {
      from: account,
      to: asAddress(toAddress),
      amount,
      network: scope,
      ...(isNativeSend ? {} : { mint: asAddress(assetReference) }),
    };

    const transactionMessage = await builder.buildTransactionMessage(params);

    const base64EncodedTransactionMessage =
      await fromCompilableTransactionMessageToBase64String(transactionMessage);

    const keyringRequest: KeyringRequest = {
      id: globalThis.crypto.randomUUID(),
      scope,
      account: fromAccountId,
      origin: METAMASK_ORIGIN,
      request: {
        method: SolMethod.SignAndSendTransaction,
        params: {
          account: {
            address: account.address,
          },
          transaction: base64EncodedTransactionMessage,
          scope,
        },
      },
    };

    this.#logger.log('Submitting keyring request', keyringRequest);

    return this.#keyring.submitRequest(keyringRequest);
  }

  /**
   * Handles the input of an address.
   *
   * @param request - The JSON-RPC request containing the parameters.
   * @returns The response to the JSON-RPC request.
   * @throws {InvalidParamsError} If the params are invalid.
   */
  async onAddressInput(
    request: OnAddressInputRequest,
  ): Promise<ValidationResponse> {
    const {
      params: { value },
    } = request;

    if (value === '') {
      return {
        valid: false,
        errors: [{ code: SendErrorCodes.Required }],
      };
    }

    try {
      asAddress(value);

      return {
        valid: true,
        errors: [],
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{ code: SendErrorCodes.Invalid }],
      };
    }
  }

  /**
   * Handles the input of an amount.
   *
   * Covers the following errors:
   * - Required: If the value is empty.
   * - InsufficientSolToCoverFee: If the value is less than the minimum balance for rent exemption.
   * - InsufficientBalance: If the value is greater than the balance.
   *
   * @param request - The JSON-RPC request containing the parameters.
   * @returns The response to the JSON-RPC request.
   */
  async onAmountInput(
    request: OnAmountInputRequest,
  ): Promise<ValidationResponse> {
    const {
      params: { value, accountId, assetId },
    } = request;

    const account = await this.#keyring.getAccountOrThrow(accountId);

    const { chainId } = parseCaipAssetType(assetId);

    const scope = chainId as Network;

    const nativeAssetType = Networks[scope].nativeToken.caip19Id;

    const isNativeToken = assetId === nativeAssetType;

    const accountBalances = await this.#assetsService.findByAccount(account);

    const assetEntry = accountBalances.find(
      (asset) => asset.assetType === assetId,
    );

    const nativeAsset = accountBalances.find(
      (asset) => asset.assetType === nativeAssetType,
    );

    if (!assetEntry) {
      throw new Error(
        `Balance not found for asset ${assetId} and account ${accountId}`,
      );
    }

    // 1. value is required
    if (value === '') {
      return {
        valid: false,
        errors: [{ code: SendErrorCodes.Required }],
      };
    }

    const assetBalanceLamports = solToLamports(assetEntry.uiAmount ?? '0');
    const nativeBalanceLamports = solToLamports(nativeAsset?.uiAmount ?? '0');
    const valueLamports = solToLamports(value);

    const minimumBalanceForRentExemptionLamports =
      await this.#getCachedMinimumBalanceForRentExemption(scope);

    const builder = isNativeToken
      ? this.#sendSolBuilder
      : this.#sendSplTokenBuilder;

    const sendFeeCalculator = new SendFeeCalculator(builder);
    const feeInLamports = sendFeeCalculator.getFee();
    const feeEstimatedInLamports = BigNumber(feeInLamports.toString());

    // If you have 0 SOL, you can't pay for the fee, it's invalid
    if (nativeBalanceLamports.isZero()) {
      return {
        valid: false,
        errors: [{ code: SendErrorCodes.InsufficientBalance }],
      };
    }

    if (isNativeToken) {
      // First check if the amount alone exceeds the native balance
      if (valueLamports.gt(nativeBalanceLamports)) {
        return {
          valid: false,
          errors: [{ code: SendErrorCodes.InsufficientBalance }],
        };
      }

      // Then check if the (amount + fee + minimum balance for rent exemption) is greater than the native balance
      const isAmountPlusFeePlusRentExemptionGreaterThanBalance = valueLamports
        .plus(feeEstimatedInLamports)
        .plus(minimumBalanceForRentExemptionLamports)
        .gt(nativeBalanceLamports);

      if (isAmountPlusFeePlusRentExemptionGreaterThanBalance) {
        return {
          valid: false,
          errors: [{ code: SendErrorCodes.InsufficientBalanceToCoverFee }],
        };
      }
    } else {
      // For SPL tokens, we need to ensure the native SOL balance can cover:
      // 1. Transaction fees
      // 2. Minimum balance for rent exemption (for potential ATA creation)

      // Check if the amount is greater than the asset balance
      const isAmountGreaterThanAssetBalance =
        valueLamports.gt(assetBalanceLamports);

      if (isAmountGreaterThanAssetBalance) {
        return {
          valid: false,
          errors: [{ code: SendErrorCodes.InsufficientBalance }],
        };
      }

      // Check if the native SOL balance can cover fees + minimum rent exemption
      const isFeePlusRentExemptionGreaterThanNativeBalance =
        feeEstimatedInLamports
          .plus(minimumBalanceForRentExemptionLamports)
          .gt(nativeBalanceLamports);

      if (isFeePlusRentExemptionGreaterThanNativeBalance) {
        return {
          valid: false,
          errors: [{ code: SendErrorCodes.InsufficientBalanceToCoverFee }],
        };
      }
    }

    return {
      valid: true,
      errors: [],
    };
  }
}
