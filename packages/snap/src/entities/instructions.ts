import { type Infer } from '@metamask/superstruct';
import {
  COMPUTE_BUDGET_PROGRAM_ADDRESS,
  ComputeBudgetInstruction,
  identifyComputeBudgetInstruction,
  parseRequestHeapFrameInstruction,
  parseRequestUnitsInstruction,
  parseSetComputeUnitLimitInstruction,
  parseSetComputeUnitPriceInstruction,
  parseSetLoadedAccountsDataSizeLimitInstruction,
} from '@solana-program/compute-budget';
import {
  identifySystemInstruction,
  parseAdvanceNonceAccountInstruction,
  parseAllocateInstruction,
  parseAllocateWithSeedInstruction,
  parseAssignInstruction,
  parseAssignWithSeedInstruction,
  parseAuthorizeNonceAccountInstruction,
  parseCreateAccountInstruction,
  parseCreateAccountWithSeedInstruction,
  parseInitializeNonceAccountInstruction,
  parseTransferSolInstruction,
  parseTransferSolWithSeedInstruction,
  parseUpgradeNonceAccountInstruction,
  parseWithdrawNonceAccountInstruction,
  SYSTEM_PROGRAM_ADDRESS,
  SystemInstruction,
} from '@solana-program/system';
import {
  ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
  identifyTokenInstruction,
  parseAmountToUiAmountInstruction,
  parseApproveCheckedInstruction,
  parseApproveInstruction,
  parseBurnCheckedInstruction,
  parseBurnInstruction,
  parseCloseAccountInstruction,
  parseFreezeAccountInstruction,
  parseGetAccountDataSizeInstruction,
  parseInitializeAccount2Instruction,
  parseInitializeAccount3Instruction,
  parseInitializeAccountInstruction,
  parseInitializeImmutableOwnerInstruction,
  parseInitializeMint2Instruction,
  parseInitializeMintInstruction,
  parseInitializeMultisig2Instruction,
  parseInitializeMultisigInstruction,
  parseMintToCheckedInstruction,
  parseMintToInstruction,
  parseRevokeInstruction,
  parseSetAuthorityInstruction,
  parseSyncNativeInstruction,
  parseThawAccountInstruction,
  parseTransferCheckedInstruction,
  parseTransferInstruction,
  parseUiAmountToAmountInstruction,
  TOKEN_PROGRAM_ADDRESS,
  TokenInstruction,
} from '@solana-program/token';
import {
  AssociatedTokenInstruction,
  identifyAssociatedTokenInstruction as identifyAssociatedToken2022Instruction,
  identifyToken2022Instruction,
  parseAmountToUiAmountInstruction as parseAmountToUiAmount2022Instruction,
  parseApplyConfidentialPendingBalanceInstruction,
  parseApproveInstruction as parseApprove2022Instruction,
  parseApproveCheckedInstruction as parseApproveChecked2022Instruction,
  parseApproveConfidentialTransferAccountInstruction,
  parseBurnInstruction as parseBurn2022Instruction,
  parseBurnCheckedInstruction as parseBurnChecked2022Instruction,
  parseCloseAccountInstruction as parseCloseAccount2022Instruction,
  parseConfidentialDepositInstruction,
  parseConfidentialTransferInstruction,
  parseConfidentialTransferWithFeeInstruction,
  parseConfidentialWithdrawInstruction,
  parseConfigureConfidentialTransferAccountInstruction,
  parseCreateAssociatedTokenIdempotentInstruction,
  parseCreateAssociatedTokenInstruction,
  parseCreateNativeMintInstruction,
  parseDisableConfidentialCreditsInstruction,
  parseDisableCpiGuardInstruction,
  parseDisableHarvestToMintInstruction,
  parseDisableMemoTransfersInstruction,
  parseDisableNonConfidentialCreditsInstruction,
  parseEmitTokenMetadataInstruction,
  parseEmptyConfidentialTransferAccountInstruction,
  parseEnableConfidentialCreditsInstruction,
  parseEnableCpiGuardInstruction,
  parseEnableHarvestToMintInstruction,
  parseEnableMemoTransfersInstruction,
  parseEnableNonConfidentialCreditsInstruction,
  parseFreezeAccountInstruction as parseFreezeAccount2022Instruction,
  parseGetAccountDataSizeInstruction as parseGetAccountDataSize2022Instruction,
  parseHarvestWithheldTokensToMintForConfidentialTransferFeeInstruction,
  parseHarvestWithheldTokensToMintInstruction,
  parseInitializeAccountInstruction as parseInitializeAccount2022Instruction,
  parseInitializeAccount2Instruction as parseInitializeAccount22022Instruction,
  parseInitializeAccount3Instruction as parseInitializeAccount32022Instruction,
  parseInitializeConfidentialTransferFeeInstruction,
  parseInitializeConfidentialTransferMintInstruction,
  parseInitializeDefaultAccountStateInstruction,
  parseInitializeGroupMemberPointerInstruction,
  parseInitializeGroupPointerInstruction,
  parseInitializeImmutableOwnerInstruction as parseInitializeImmutableOwner2022Instruction,
  parseInitializeInterestBearingMintInstruction,
  parseInitializeMetadataPointerInstruction,
  parseInitializeMintInstruction as parseInitializeMint2022Instruction,
  parseInitializeMint2Instruction as parseInitializeMint22022Instruction,
  parseInitializeMintCloseAuthorityInstruction,
  parseInitializeMultisigInstruction as parseInitializeMultisig2022Instruction,
  parseInitializeNonTransferableMintInstruction,
  parseInitializePausableConfigInstruction,
  parseInitializePermanentDelegateInstruction,
  parseInitializeScaledUiAmountMintInstruction,
  parseInitializeTokenGroupInstruction,
  parseInitializeTokenGroupMemberInstruction,
  parseInitializeTokenMetadataInstruction,
  parseInitializeTransferFeeConfigInstruction,
  parseInitializeTransferHookInstruction,
  parseMintToInstruction as parseMintTo2022Instruction,
  parseMintToCheckedInstruction as parseMintToChecked2022Instruction,
  parsePauseInstruction,
  parseReallocateInstruction,
  parseRecoverNestedAssociatedTokenInstruction,
  parseRemoveTokenMetadataKeyInstruction,
  parseResumeInstruction,
  parseRevokeInstruction as parseRevoke2022Instruction,
  parseSetAuthorityInstruction as parseSetAuthority2022Instruction,
  parseSetTransferFeeInstruction,
  parseSyncNativeInstruction as parseSyncNative2022Instruction,
  parseThawAccountInstruction as parseThawAccount2022Instruction,
  parseTransferInstruction as parseTransfer2022Instruction,
  parseTransferCheckedInstruction as parseTransferChecked2022Instruction,
  parseTransferCheckedWithFeeInstruction,
  parseUiAmountToAmountInstruction as parseUiAmountToAmount2022Instruction,
  parseUpdateConfidentialTransferMintInstruction,
  parseUpdateDefaultAccountStateInstruction,
  parseUpdateGroupMemberPointerInstruction,
  parseUpdateGroupPointerInstruction,
  parseUpdateMetadataPointerInstruction,
  parseUpdateMultiplierScaledUiMintInstruction,
  parseUpdateRateInterestBearingMintInstruction,
  parseUpdateTokenGroupMaxSizeInstruction,
  parseUpdateTokenGroupUpdateAuthorityInstruction,
  parseUpdateTokenMetadataFieldInstruction,
  parseUpdateTokenMetadataUpdateAuthorityInstruction,
  parseUpdateTransferHookInstruction,
  parseWithdrawExcessLamportsInstruction,
  parseWithdrawWithheldTokensFromAccountsForConfidentialTransferFeeInstruction,
  parseWithdrawWithheldTokensFromAccountsInstruction,
  parseWithdrawWithheldTokensFromMintForConfidentialTransferFeeInstruction,
  parseWithdrawWithheldTokensFromMintInstruction,
  Token2022Instruction,
  TOKEN_2022_PROGRAM_ADDRESS,
} from '@solana-program/token-2022';
import type { Rpc, SolanaRpcApi } from '@solana/kit';
import { getBase58Codec, type Address, type IInstruction } from '@solana/kit';

import {
  fromBytesToCompilableTransactionMessage,
  fromUnknowBase64StringToTransactionOrTransactionMessage,
} from '../core/sdk-extensions/codecs';
import type { Base64Struct } from '../core/validation/structs';

/**
 * Truncates the instruction data to 12 characters.
 * @param data - The instruction data to truncate.
 * @returns The truncated instruction data.
 */
export function truncateInstructionData(data: string) {
  if (data.length > 12) {
    return `${data.slice(0, 5)}...${data.slice(-5)}`;
  }

  return data;
}

// List of all the program addresses that we support parsing instructions for
type ParseableInstructionProgramAddress =
  | typeof SYSTEM_PROGRAM_ADDRESS
  | typeof COMPUTE_BUDGET_PROGRAM_ADDRESS
  | typeof TOKEN_PROGRAM_ADDRESS
  | typeof TOKEN_2022_PROGRAM_ADDRESS
  | typeof ASSOCIATED_TOKEN_PROGRAM_ADDRESS;

/**
 * Union type that represents all the instruction types that we support parsing:
 * "CreateAccount" | "Assign" | "TransferSol" | ...
 */
type InstructionType =
  | keyof typeof SystemInstruction
  | keyof typeof ComputeBudgetInstruction
  | keyof typeof TokenInstruction
  | keyof typeof Token2022Instruction
  | keyof typeof AssociatedTokenInstruction;

type ParsedInstruction = {
  data: Record<string, any>;
  accounts?: Record<
    string,
    {
      address: string;
      role: number;
    }
  >;
};

type EncodedInstruction = Omit<IInstruction, 'data' | 'accounts'> & {
  dataBase58: string;
};

// When the instruction is parsed successfully, we return data with this structure
export type InstructionParseSuccess = {
  type: InstructionType;
  encoded: EncodedInstruction;
  parsed: ParsedInstruction;
};

// When the instruction cannot be parsed, we return data with this structure
export type InstructionParseFailure = {
  type: 'Unknown';
  encoded: EncodedInstruction;
  parsed: null;
};

export type InstructionParseResult =
  | InstructionParseSuccess
  | InstructionParseFailure;

type ParsingConfig<TInstructionType extends string> = {
  /** The function that, given an instruction, returns its type (e.g. Token2022Instruction.InitializeMint) */
  identifier: (instruction: IInstruction) => TInstructionType;
  /** The enum that maps every instruction type (e.g. Token2022Instruction.InitializeMint) to the instruction type */
  instructionEnum: Record<number, string>;
  /** Maps every instruction type (e.g. Token2022Instruction.InitializeMint) to the function that parses it */
  typeToParserMap: Record<
    TInstructionType,
    (instruction: IInstruction) => ParsedInstruction
  >;
};

// Structure that maps every supported program address to
const programAddressToParsingConfig: Record<
  ParseableInstructionProgramAddress,
  ParsingConfig<InstructionType>
> = {
  [SYSTEM_PROGRAM_ADDRESS]: {
    identifier: identifySystemInstruction,
    instructionEnum: SystemInstruction,
    typeToParserMap: {
      [SystemInstruction.Assign]: parseAssignInstruction,
      [SystemInstruction.TransferSol]: parseTransferSolInstruction,
      [SystemInstruction.CreateAccount]: parseCreateAccountInstruction,
      [SystemInstruction.CreateAccountWithSeed]:
        parseCreateAccountWithSeedInstruction,
      [SystemInstruction.AdvanceNonceAccount]:
        parseAdvanceNonceAccountInstruction,
      [SystemInstruction.WithdrawNonceAccount]:
        parseWithdrawNonceAccountInstruction,
      [SystemInstruction.InitializeNonceAccount]:
        parseInitializeNonceAccountInstruction,
      [SystemInstruction.AuthorizeNonceAccount]:
        parseAuthorizeNonceAccountInstruction,
      [SystemInstruction.Allocate]: parseAllocateInstruction,
      [SystemInstruction.AllocateWithSeed]: parseAllocateWithSeedInstruction,
      [SystemInstruction.AssignWithSeed]: parseAssignWithSeedInstruction,
      [SystemInstruction.TransferSolWithSeed]:
        parseTransferSolWithSeedInstruction,
      [SystemInstruction.UpgradeNonceAccount]:
        parseUpgradeNonceAccountInstruction,
    },
  },
  [COMPUTE_BUDGET_PROGRAM_ADDRESS]: {
    identifier: identifyComputeBudgetInstruction,
    instructionEnum: ComputeBudgetInstruction,
    typeToParserMap: {
      [ComputeBudgetInstruction.RequestUnits]: parseRequestUnitsInstruction,
      [ComputeBudgetInstruction.RequestHeapFrame]:
        parseRequestHeapFrameInstruction,
      [ComputeBudgetInstruction.SetComputeUnitPrice]:
        parseSetComputeUnitPriceInstruction,
      [ComputeBudgetInstruction.SetComputeUnitLimit]:
        parseSetComputeUnitLimitInstruction,
      [ComputeBudgetInstruction.SetLoadedAccountsDataSizeLimit]:
        parseSetLoadedAccountsDataSizeLimitInstruction,
    },
  },
  [TOKEN_PROGRAM_ADDRESS]: {
    identifier: identifyTokenInstruction,
    instructionEnum: TokenInstruction,
    typeToParserMap: {
      [TokenInstruction.InitializeMint]: parseInitializeMintInstruction,
      [TokenInstruction.InitializeAccount]: parseInitializeAccountInstruction,
      [TokenInstruction.InitializeMultisig]: parseInitializeMultisigInstruction,
      [TokenInstruction.Transfer]: parseTransferInstruction,
      [TokenInstruction.Approve]: parseApproveInstruction,
      [TokenInstruction.Revoke]: parseRevokeInstruction,
      [TokenInstruction.SetAuthority]: parseSetAuthorityInstruction,
      [TokenInstruction.MintTo]: parseMintToInstruction,
      [TokenInstruction.Burn]: parseBurnInstruction,
      [TokenInstruction.CloseAccount]: parseCloseAccountInstruction,
      [TokenInstruction.FreezeAccount]: parseFreezeAccountInstruction,
      [TokenInstruction.ThawAccount]: parseThawAccountInstruction,
      [TokenInstruction.TransferChecked]: parseTransferCheckedInstruction,
      [TokenInstruction.ApproveChecked]: parseApproveCheckedInstruction,
      [TokenInstruction.MintToChecked]: parseMintToCheckedInstruction,
      [TokenInstruction.BurnChecked]: parseBurnCheckedInstruction,
      [TokenInstruction.InitializeAccount2]: parseInitializeAccount2Instruction,
      [TokenInstruction.SyncNative]: parseSyncNativeInstruction,
      [TokenInstruction.InitializeAccount3]: parseInitializeAccount3Instruction,
      [TokenInstruction.InitializeMultisig2]:
        parseInitializeMultisig2Instruction,
      [TokenInstruction.InitializeMint2]: parseInitializeMint2Instruction,
      [TokenInstruction.GetAccountDataSize]: parseGetAccountDataSizeInstruction,
      [TokenInstruction.InitializeImmutableOwner]:
        parseInitializeImmutableOwnerInstruction,
      [TokenInstruction.AmountToUiAmount]: parseAmountToUiAmountInstruction,
      [TokenInstruction.UiAmountToAmount]: parseUiAmountToAmountInstruction,
    },
  },
  [TOKEN_2022_PROGRAM_ADDRESS]: {
    identifier: identifyToken2022Instruction,
    instructionEnum: Token2022Instruction,
    typeToParserMap: {
      [Token2022Instruction.InitializeMint]: parseInitializeMint2022Instruction,
      [Token2022Instruction.InitializeAccount]:
        parseInitializeAccount2022Instruction,
      [Token2022Instruction.InitializeMultisig]:
        parseInitializeMultisig2022Instruction,
      [Token2022Instruction.Transfer]: parseTransfer2022Instruction,
      [Token2022Instruction.Approve]: parseApprove2022Instruction,
      [Token2022Instruction.Revoke]: parseRevoke2022Instruction,
      [Token2022Instruction.SetAuthority]: parseSetAuthority2022Instruction,
      [Token2022Instruction.MintTo]: parseMintTo2022Instruction,
      [Token2022Instruction.Burn]: parseBurn2022Instruction,
      [Token2022Instruction.CloseAccount]: parseCloseAccount2022Instruction,
      [Token2022Instruction.FreezeAccount]: parseFreezeAccount2022Instruction,
      [Token2022Instruction.ThawAccount]: parseThawAccount2022Instruction,
      [Token2022Instruction.TransferChecked]:
        parseTransferChecked2022Instruction,
      [Token2022Instruction.ApproveChecked]: parseApproveChecked2022Instruction,
      [Token2022Instruction.MintToChecked]: parseMintToChecked2022Instruction,
      [Token2022Instruction.BurnChecked]: parseBurnChecked2022Instruction,
      [Token2022Instruction.InitializeAccount2]:
        parseInitializeAccount22022Instruction,
      [Token2022Instruction.SyncNative]: parseSyncNative2022Instruction,
      [Token2022Instruction.InitializeAccount3]:
        parseInitializeAccount32022Instruction,
      [Token2022Instruction.InitializeMultisig2]:
        parseInitializeMultisig2022Instruction,
      [Token2022Instruction.InitializeMint2]:
        parseInitializeMint22022Instruction,
      [Token2022Instruction.GetAccountDataSize]:
        parseGetAccountDataSize2022Instruction,
      [Token2022Instruction.InitializeImmutableOwner]:
        parseInitializeImmutableOwner2022Instruction,
      [Token2022Instruction.AmountToUiAmount]:
        parseAmountToUiAmount2022Instruction,
      [Token2022Instruction.UiAmountToAmount]:
        parseUiAmountToAmount2022Instruction,
      [Token2022Instruction.InitializeMintCloseAuthority]:
        parseInitializeMintCloseAuthorityInstruction,
      [Token2022Instruction.InitializeTransferFeeConfig]:
        parseInitializeTransferFeeConfigInstruction,
      [Token2022Instruction.TransferCheckedWithFee]:
        parseTransferCheckedWithFeeInstruction,
      [Token2022Instruction.WithdrawWithheldTokensFromMint]:
        parseWithdrawWithheldTokensFromMintInstruction,
      [Token2022Instruction.WithdrawWithheldTokensFromAccounts]:
        parseWithdrawWithheldTokensFromAccountsInstruction,
      [Token2022Instruction.HarvestWithheldTokensToMint]:
        parseHarvestWithheldTokensToMintInstruction,
      [Token2022Instruction.SetTransferFee]: parseSetTransferFeeInstruction,
      [Token2022Instruction.InitializeConfidentialTransferMint]:
        parseInitializeConfidentialTransferMintInstruction,
      [Token2022Instruction.UpdateConfidentialTransferMint]:
        parseUpdateConfidentialTransferMintInstruction,
      [Token2022Instruction.ConfigureConfidentialTransferAccount]:
        parseConfigureConfidentialTransferAccountInstruction,
      [Token2022Instruction.ApproveConfidentialTransferAccount]:
        parseApproveConfidentialTransferAccountInstruction,
      [Token2022Instruction.EmptyConfidentialTransferAccount]:
        parseEmptyConfidentialTransferAccountInstruction,
      [Token2022Instruction.ConfidentialDeposit]:
        parseConfidentialDepositInstruction,
      [Token2022Instruction.ConfidentialWithdraw]:
        parseConfidentialWithdrawInstruction,
      [Token2022Instruction.ConfidentialTransfer]:
        parseConfidentialTransferInstruction,
      [Token2022Instruction.ApplyConfidentialPendingBalance]:
        parseApplyConfidentialPendingBalanceInstruction,
      [Token2022Instruction.EnableConfidentialCredits]:
        parseEnableConfidentialCreditsInstruction,
      [Token2022Instruction.DisableConfidentialCredits]:
        parseDisableConfidentialCreditsInstruction,
      [Token2022Instruction.EnableNonConfidentialCredits]:
        parseEnableNonConfidentialCreditsInstruction,
      [Token2022Instruction.DisableNonConfidentialCredits]:
        parseDisableNonConfidentialCreditsInstruction,
      [Token2022Instruction.ConfidentialTransferWithFee]:
        parseConfidentialTransferWithFeeInstruction,
      [Token2022Instruction.InitializeDefaultAccountState]:
        parseInitializeDefaultAccountStateInstruction,
      [Token2022Instruction.UpdateDefaultAccountState]:
        parseUpdateDefaultAccountStateInstruction,
      [Token2022Instruction.Reallocate]: parseReallocateInstruction,
      [Token2022Instruction.EnableMemoTransfers]:
        parseEnableMemoTransfersInstruction,
      [Token2022Instruction.DisableMemoTransfers]:
        parseDisableMemoTransfersInstruction,
      [Token2022Instruction.CreateNativeMint]: parseCreateNativeMintInstruction,
      [Token2022Instruction.InitializeNonTransferableMint]:
        parseInitializeNonTransferableMintInstruction,
      [Token2022Instruction.InitializeInterestBearingMint]:
        parseInitializeInterestBearingMintInstruction,
      [Token2022Instruction.UpdateRateInterestBearingMint]:
        parseUpdateRateInterestBearingMintInstruction,
      [Token2022Instruction.EnableCpiGuard]: parseEnableCpiGuardInstruction,
      [Token2022Instruction.DisableCpiGuard]: parseDisableCpiGuardInstruction,
      [Token2022Instruction.InitializePermanentDelegate]:
        parseInitializePermanentDelegateInstruction,
      [Token2022Instruction.InitializeTransferHook]:
        parseInitializeTransferHookInstruction,
      [Token2022Instruction.UpdateTransferHook]:
        parseUpdateTransferHookInstruction,
      [Token2022Instruction.InitializeConfidentialTransferFee]:
        parseInitializeConfidentialTransferFeeInstruction,
      [Token2022Instruction.WithdrawWithheldTokensFromMintForConfidentialTransferFee]:
        parseWithdrawWithheldTokensFromMintForConfidentialTransferFeeInstruction,
      [Token2022Instruction.WithdrawWithheldTokensFromAccountsForConfidentialTransferFee]:
        parseWithdrawWithheldTokensFromAccountsForConfidentialTransferFeeInstruction,
      [Token2022Instruction.HarvestWithheldTokensToMintForConfidentialTransferFee]:
        parseHarvestWithheldTokensToMintForConfidentialTransferFeeInstruction,
      [Token2022Instruction.EnableHarvestToMint]:
        parseEnableHarvestToMintInstruction,
      [Token2022Instruction.DisableHarvestToMint]:
        parseDisableHarvestToMintInstruction,
      [Token2022Instruction.WithdrawExcessLamports]:
        parseWithdrawExcessLamportsInstruction,
      [Token2022Instruction.InitializeMetadataPointer]:
        parseInitializeMetadataPointerInstruction,
      [Token2022Instruction.UpdateMetadataPointer]:
        parseUpdateMetadataPointerInstruction,
      [Token2022Instruction.InitializeGroupPointer]:
        parseInitializeGroupPointerInstruction,
      [Token2022Instruction.UpdateGroupPointer]:
        parseUpdateGroupPointerInstruction,
      [Token2022Instruction.InitializeGroupMemberPointer]:
        parseInitializeGroupMemberPointerInstruction,
      [Token2022Instruction.UpdateGroupMemberPointer]:
        parseUpdateGroupMemberPointerInstruction,
      [Token2022Instruction.InitializeScaledUiAmountMint]:
        parseInitializeScaledUiAmountMintInstruction,
      [Token2022Instruction.UpdateMultiplierScaledUiMint]:
        parseUpdateMultiplierScaledUiMintInstruction,
      [Token2022Instruction.InitializePausableConfig]:
        parseInitializePausableConfigInstruction,
      [Token2022Instruction.Pause]: parsePauseInstruction,
      [Token2022Instruction.Resume]: parseResumeInstruction,
      [Token2022Instruction.InitializeTokenMetadata]:
        parseInitializeTokenMetadataInstruction,
      [Token2022Instruction.UpdateTokenMetadataField]:
        parseUpdateTokenMetadataFieldInstruction,
      [Token2022Instruction.RemoveTokenMetadataKey]:
        parseRemoveTokenMetadataKeyInstruction,
      [Token2022Instruction.UpdateTokenMetadataUpdateAuthority]:
        parseUpdateTokenMetadataUpdateAuthorityInstruction,
      [Token2022Instruction.EmitTokenMetadata]:
        parseEmitTokenMetadataInstruction,
      [Token2022Instruction.InitializeTokenGroup]:
        parseInitializeTokenGroupInstruction,
      [Token2022Instruction.UpdateTokenGroupMaxSize]:
        parseUpdateTokenGroupMaxSizeInstruction,
      [Token2022Instruction.UpdateTokenGroupUpdateAuthority]:
        parseUpdateTokenGroupUpdateAuthorityInstruction,
      [Token2022Instruction.InitializeTokenGroupMember]:
        parseInitializeTokenGroupMemberInstruction,
    },
  },
  [ASSOCIATED_TOKEN_PROGRAM_ADDRESS]: {
    identifier: identifyAssociatedToken2022Instruction,
    instructionEnum: AssociatedTokenInstruction,
    typeToParserMap: {
      [AssociatedTokenInstruction.CreateAssociatedToken]:
        parseCreateAssociatedTokenInstruction,
      [AssociatedTokenInstruction.CreateAssociatedTokenIdempotent]:
        parseCreateAssociatedTokenIdempotentInstruction,
      [AssociatedTokenInstruction.RecoverNestedAssociatedToken]:
        parseRecoverNestedAssociatedTokenInstruction,
    },
  },
};

/**
 * Parses a generic instruction, returning the parsed instruction if it's supported,
 * or the original non-parsed instruction if it's not.
 *
 * Enhances the data with various representations for convenience:
 * - The data as a Uint8Array.
 * - The data as a base58 string.
 *
 * @example
 * ```ts
 * const instruction = {
 *   programAddress: SYSTEM_PROGRAM_ADDRESS,
 *   data: new Uint8Array([0]),
 * };
 * const parsedInstruction = parseInstruction(instruction, SYSTEM_PROGRAM_ADDRESS);
 * ```
 * @param instruction - The instruction to parse.
 * @param programAddress - The program address of the instruction.
 * @returns The result of the instruction parsing.
 */
export const parseInstruction = (
  instruction: IInstruction,
  programAddress: Address,
): InstructionParseResult => {
  // We need to rewrite the data field from ReadonlyUint8Array to Uint8Array
  // because the interface context is serialized as JSON, and JSON does not support ReadonlyUint8Array
  const encoded = {
    ...instruction,
    // data: new Uint8Array(instruction.data ?? []),
    dataBase58: getBase58Codec().decode(instruction.data ?? new Uint8Array()),
  };

  try {
    const parsingConfig: ParsingConfig<InstructionType> =
      // @ts-expect-error - we check if parsingConfig exists right after
      programAddressToParsingConfig[programAddress];

    if (!parsingConfig) {
      throw new Error('Unsupported program address');
    }

    const { identifier, typeToParserMap, instructionEnum } = parsingConfig;
    const instructionType = identifier(instruction);
    const type = instructionEnum[
      instructionType as unknown as number
    ] as InstructionType;
    const parser = typeToParserMap[instructionType];

    if (!parser) {
      throw new Error('Unsupported instruction type');
    }

    const parsed = parser(instruction);

    return {
      type,
      encoded,
      parsed,
    };
  } catch (error) {
    return {
      type: 'Unknown',
      encoded,
      parsed: null,
    };
  }
};

/**
 * Extracts the instructions from a base64 string, adapting the logic depending on whether
 * the string represents a transaction or a transaction message.
 *
 * @param rpc - The RPC to use to extract the instructions.
 * @param base64EncodedString - The base64 encoded string to extract the instructions from.
 * @returns The instructions from the base64 encoded string.
 * @throws If the base64 encoded string is not a valid transaction or transaction message.
 */
export const extractInstructionsFromUnknownBase64String = async (
  rpc: Rpc<SolanaRpcApi>,
  base64EncodedString: Infer<typeof Base64Struct>,
): Promise<InstructionParseResult[]> => {
  const transactionOrTransactionMessage =
    await fromUnknowBase64StringToTransactionOrTransactionMessage(
      base64EncodedString,
      rpc,
    );

  const transactionMessage =
    'instructions' in transactionOrTransactionMessage
      ? transactionOrTransactionMessage
      : await fromBytesToCompilableTransactionMessage(
          transactionOrTransactionMessage.messageBytes,
          rpc,
        );

  const { instructions } = transactionMessage;
  return instructions.map((instruction) => {
    const { programAddress } = instruction;
    return parseInstruction(instruction, programAddress);
  });
};
