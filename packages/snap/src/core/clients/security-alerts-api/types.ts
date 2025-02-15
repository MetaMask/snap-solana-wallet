/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Error details
 */
export type ApiErrorDetails = {
  type: string;
  message: string;
};

export type TransactionErrorDetails = ApiErrorDetails & {
  number?: number | null;
  code?: string | null;
  transaction_index: number;
};

export type InstructionErrorDetails = ApiErrorDetails & {
  transaction_index: number;
  instruction_index: number;
  program_account: string | null;
};

/**
 * Assets change
 */
export type AssetChange = {
  usd_price: number | null;
  summary: string | null;
  value: number;
  raw_value: number;
};

export type SplTokenAsset = {
  type: 'TOKEN';
  address: string;
  symbol: string;
  name: string;
  logo?: string;
  decimals: number;
};

export type NonFungibleAsset = {
  type: 'NFT';
  address: string;
  symbol: string;
  name: string;
  logo?: string;
  decimals: number;
};

export type CompressedNonFungibleAsset = {
  type: 'CNFT';
  address: string;
  symbol: string;
  name: string;
  logo?: string;
  decimals: number;
};

export type NativeAsset = {
  type: 'NativeToken';
  decimals: number;
  logo: string | null;
};

export type AssetDiff<Asset> = {
  asset_type: string;
  asset: Asset;
  in: AssetChange | null;
  out: AssetChange | null;
};

export type AccountDetails = {
  type: string;
  account_address: string;
  description: string | null;
  was_written_to: boolean;
};

/**
 * Account details
 */
export type AccountSummary = {
  account_assets_diff: AssetDiff<
    NativeAsset | SplTokenAsset | NonFungibleAsset | CompressedNonFungibleAsset
  >[];
  account_delegations: any[];
  account_ownerships_diff: any[];
  total_usd_diff: {
    in: number;
    out: number;
    total: number;
  };
};

export type Simulation = {
  asset_diff: Record<
    string,
    AssetDiff<
      | NativeAsset
      | SplTokenAsset
      | NonFungibleAsset
      | CompressedNonFungibleAsset
    >
  >;
  assets_ownership_diff: Record<string, any>; // Not implemented yet
  delegations: Record<string, any>; // Not implemented yet
  accounts_details: AccountDetails[];
  account_summary: AccountSummary;
};

export type SecurityAlertSimulationValidationResponse = {
  encoding: 'base58';
  status: 'SUCCESS' | 'ERROR';
  error: string | null;
  error_details:
    | ApiErrorDetails
    | TransactionErrorDetails
    | InstructionErrorDetails;
  result: {
    simulation: Simulation;
    validation: {
      result_type: 'Benign' | 'Warning' | 'Malicious';
      reason:
        | 'shared_state_in_bulk'
        | 'unknown_profiter'
        | 'unfair_trade'
        | 'transfer_farming'
        | 'writable_accounts_farming'
        | 'native_ownership_change'
        | 'spl_token_ownership_change'
        | 'exposure_farming'
        | 'known_attacker'
        | 'invalid_signature';
      features: string[];
      extended_features: any[]; // Not implemented yet
    };
  };
  request_id: string;
};
