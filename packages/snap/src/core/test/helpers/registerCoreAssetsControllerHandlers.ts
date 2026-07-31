import type { Asset } from '@metamask/assets-controller';
import type { SimulationUserOptions } from '@metamask/snaps-simulation';
import type { CaipAssetType } from '@metamask/utils';

type ControllerMessenger = {
  registerActionHandler: (
    action: string,
    handler: (...args: unknown[]) => unknown,
  ) => void;
};

const DEFAULT_RAW_AMOUNT = '123456789';

function buildMockAsset(
  assetId: CaipAssetType,
  metadata?: { symbol: string; name: string },
): Asset {
  const chainId = assetId.split('/')[0] as Asset['chainId'];
  const isNative = assetId.endsWith('/slip44:501');

  return {
    id: assetId as Asset['id'],
    chainId,
    balance: { amount: DEFAULT_RAW_AMOUNT },
    metadata: {
      type: isNative ? 'native' : 'spl',
      symbol: metadata?.symbol ?? (isNative ? 'SOL' : 'TOKEN'),
      name: metadata?.name ?? (isNative ? 'Solana' : 'Token'),
      decimals: 9,
    },
    price: {
      assetPriceType: 'fungible',
      price: 1,
      usdPrice: 1,
      lastUpdated: 0,
    },
    fiatValue: 1,
  };
}

function buildAssetsForAccount(
  accountId: string,
  options: SimulationUserOptions,
): Record<string, Asset> {
  const account = options.accounts?.find((entry) => entry.id === accountId);
  if (!account?.assets?.length) {
    return {};
  }

  const assets: Record<string, Asset> = {};
  for (const assetId of account.assets) {
    assets[assetId] = buildMockAsset(assetId, options.assets?.[assetId]);
  }
  return assets;
}

/**
 * Registers AssetsController messenger handlers for snaps-jest simulation.
 * Maps installSnap `accounts` / `assets` options to Core AssetsController reads.
 */
export function registerCoreAssetsControllerHandlers(
  controllerMessenger: ControllerMessenger,
  options: SimulationUserOptions,
): void {
  controllerMessenger.registerActionHandler(
    'AssetsController:getAssets',
    (...args: unknown[]) => {
      const accounts = args[0] as { id: string }[];
      const byAccount: Record<string, Record<string, Asset>> = {};
      for (const account of accounts) {
        byAccount[account.id] = buildAssetsForAccount(account.id, options);
      }
      return byAccount;
    },
  );

  controllerMessenger.registerActionHandler(
    'AssetsController:getAsset',
    (...args: unknown[]) => {
      const accountId = args[0] as string;
      const assetId = args[1] as string;
      const assets = buildAssetsForAccount(accountId, options);
      return assets[assetId] ?? null;
    },
  );
}
