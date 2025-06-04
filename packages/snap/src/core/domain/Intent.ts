import type { Infer } from '@metamask/superstruct';
import { object, string } from '@metamask/superstruct';
import { CaipAssetTypeStruct } from '@metamask/utils';

import { UuidStruct } from '../validation/structs';

export const AssetAmountStruct = object({
  assetType: CaipAssetTypeStruct,
  amount: string(),
});

export const IntentStruct = object({
  id: UuidStruct,
  timestamp: string(),
  accountId: string(),
  from: AssetAmountStruct,
  to: AssetAmountStruct,
});

export type Intent = Infer<typeof IntentStruct>;
