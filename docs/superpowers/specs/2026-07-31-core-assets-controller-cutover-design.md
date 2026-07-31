# Solana Snap: Core AssetsController cutover

**Date:** 2026-07-31  
**Status:** Approved for planning  
**Reference:** Tron snap (`snap-tron-wallet` / ASSET-2) messenger + `AssetsService` read API shape

## Goal

Remove Snap-owned Solana asset balance maintenance. Core `AssetsController` becomes the source of truth for balances. All balance reads in the Snap go through `AssetsService` methods that call Core via `endowment:messenger`. Metadata and market-data handlers remain Snap-side.

## Non-goals

- Tron-style staged migration / feature flags / Snap+Core dual read path
- Writing balances from the Snap into Core (`upsert` / save paths)
- Changing how Core discovers or subscribes to Solana balances
- Removing WebSocket account monitoring used for **transaction** discovery

## Platform & dependencies

| Item | Change |
|---|---|
| Snap version | Bump (e.g. `2.8.0` → `2.9.0`) |
| `platformVersion` / `@metamask/snaps-sdk` | `11.2.0` |
| `@metamask/snaps-cli` | Align with Tron (`^8.4.1`) as needed for SDK 11 |
| New deps | `@metamask/assets-controller@11.2.0`, `@metamask/messenger@^2.0.0` |
| Manifest | Add `endowment:messenger` with actions below |
| Root resolutions | Bump `@metamask/snaps-sdk` to `^11.2.0` |

### Manifest messenger actions

```json
"endowment:messenger": {
  "actions": [
    "AssetsController:getAsset",
    "AssetsController:getAssets"
  ]
}
```

### Messenger initialization

In `snapContext.ts`:

```ts
import { getMessenger } from '@metamask/snaps-sdk';

const coreMessenger = getMessenger<CoreMessenger>();
```

New types module (Tron-shaped), e.g. `packages/snap/src/types/core-messenger.ts`:

- `CoreMessengerActions` = `AssetsControllerGetAssetAction | AssetsControllerGetAssetsAction`
- `CoreMessenger` / `CoreMessengerCaller` (`Pick<AsyncMessenger<CoreMessenger>, 'call'>`)

**Hard rule:** call sites never invoke `coreMessenger` for assets. Only `AssetsService` (via `CoreAssetsAdapter`) may call Core asset actions.

## Architecture

```
Keyring / Send / AccountsSynchronizer / Transactions / UI
                    │
                    ▼
              AssetsService
       ┌────────────┼────────────────────┐
       │            │                    │
  balance reads   metadata            market data
       │            │                    │
       ▼            ▼                    ▼
 CoreAssetsAdapter  TokenApiClient  TokenPricesService
       │
       ▼
 getMessenger() → AssetsController:getAsset | getAssets
```

## `AssetsService` public API

### Balance reads (Core)

| Method | Core action | Behavior |
|---|---|---|
| `getAccountAssetByID(accountId, assetId)` | `AssetsController:getAsset` | Map Core `Asset` → `AssetEntity`, or `null` if missing |
| `getAccountAssets(accountId)` | `AssetsController:getAssets` | List **all** assets for the keyring account; map to `AssetEntity[]` |
| `getAccountAssetsByIDs(accountId, assetIds)` | `AssetsController:getAssets` (single batch call) | Filter Core result to requested IDs; preserve input order; missing → `null` |

`getAssets` is the batch/list API. Do **not** implement `getAccountAssetsByIDs` as N× `getAsset`.

`getAssets` is called with a minimal account stub `{ id: accountId }` and Solana `chainIds` from config/active networks. Reads use current controller state (no `forceUpdate` from the Snap unless a later need appears).

### Snap-only (unchanged responsibility)

| Method | Backend |
|---|---|
| `getAssetsMetadata(assetTypes)` | `TokenApiClient` (+ native SOL metadata) |
| `fetchAssetsMarketData(assets)` | `TokenPricesService` |

### Removed from `AssetsService`

`fetch`, `save`, `saveMany`, `getAll`, `findByAccount`, `getNativeAssetTypes`, `hasChanged`, and private on-chain balance fetch helpers that existed only to populate Snap state.

## `CoreAssetsAdapter`

Thin mapper (same role as Tron):

- `getAccountAsset(accountId, assetId)` → `getAsset`
- `getAccountAssets(accountId)` → `getAssets` → `AssetEntity[]`
- `getAccountAssetsByIds(accountId, assetIds)` → `getAssets` once → ordered `(AssetEntity | null)[]`

Map Core `Asset` fields (`balance.amount`, `metadata.symbol` / `decimals` / `image`) into Solana `AssetEntity` (`assetType`, `keyringAccountId`, `network`, `rawAmount`, `uiAmount`, `symbol`, `decimals`, plus native vs token shape as required by existing entity types).

## Deletions

| Artifact | Action |
|---|---|
| `AssetsRepository` (+ tests) | Delete |
| `UnencryptedStateValue.assetEntities` | Remove from `State` defaults; migrate/omit legacy key on load if present |
| Snap emit of `AccountAssetListUpdated` / `AccountBalancesUpdated` from asset saves | Delete with `saveMany` |
| On-chain `AssetsService.fetch` / token-account matrix fetch used only for Snap persistence | Delete |

**Keep:** `TokenHelper`, `TokenApiClient`, `TokenPricesService`, NFT client usage only if still needed for metadata (current NFT metadata path may stay disabled as today).

## Call-site rewires

| Caller | Before | After |
|---|---|---|
| `Keyring.listAccountAssets` | `findByAccount` | `getAccountAssets` → CAIP asset types (keep zero-balance filtering policy as today unless product says otherwise) |
| `Keyring.getAccountBalances` | `findByAccount` + filter | `getAccountAssetsByIDs(accountId, assets)` |
| `SendService.onAmountInput` | `findByAccount` | `getAccountAssetsByIDs` for selected asset + native SOL |
| `features/send/render` | `getAll()` | Per-account `getAccountAssets` (aggregate across keyring accounts as needed) |
| `refreshSend` cron | `getAll()` | Same as send render (account-scoped Core reads) |
| `AccountsSynchronizer.synchronize` | `fetch` + `saveMany` + txs | For each account: `getAccountAssets` → `transactionsService.fetchAssetsTransactions` → `saveMany` txs only |
| `TransactionMapper` / `TransactionsService` | `getAssetsMetadata` | Unchanged (still via `AssetsService`) |
| `onAssetsLookup` / `onAssetsMarketData` | metadata / market | Unchanged |
| `KeyringAccountMonitor` | `save` balances (+ metadata for symbol) | **Keep** WS handlers and causing-transaction persistence; **strip** all `AssetsService.save` / balance persistence |

## `KeyringAccountMonitor`

Retained for transaction discovery on `accountSubscribe` / `programSubscribe` and connection-recovery sync of **transactions** (via `AccountsSynchronizer` without asset writes). Balance updates are owned by Core; the Snap must not persist or emit asset list/balance keyring events from these notifications.

## Errors & empty results

- Controller returns `undefined` / missing id → `null` in by-ID APIs; omitted from full list
- `getAccountAssetsByIDs` length and order always match `assetIds`
- Messenger failures: log and surface consistently (prefer propagating after log for unexpected errors; treat “not found” as `null`)

## Testing

- Unit tests for `CoreAssetsAdapter` and `AssetsService` balance methods with mocked messenger (`getAsset` / `getAssets`)
- Update Keyring, Send, AccountsSynchronizer, KeyringAccountMonitor tests for new APIs and removed saves
- Delete repository / Snap-persist-focused asset tests
- Keep `onAssetsLookup` / `onAssetsMarketData` tests against Snap metadata/market methods

## Success criteria

1. No Snap persistence of Solana balances (`assetEntities` gone).
2. All balance reads go through `getAccountAssetByID` / `getAccountAssetsByIDs` / `getAccountAssets`.
3. SDK + manifest messenger endowment match the Core actions above.
4. WS monitor still saves causing transactions; it does not save balances.
5. Metadata and market-data handlers still work via Snap services.
