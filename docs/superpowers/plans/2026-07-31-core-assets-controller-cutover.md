# Core AssetsController Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Snap-owned Solana balance persistence and route all balance reads through `AssetsService` → Core `AssetsController` via `endowment:messenger`, matching the three Tron-style APIs (`getAccountAssetByID`, `getAccountAssetsByIDs`, `getAccountAssets`).

**Architecture:** Slim `AssetsService` keeps Snap-side metadata/market methods; balance reads go through `CoreAssetsAdapter` calling `AssetsController:getAsset` / `getAssets`. Delete `AssetsRepository` and `assetEntities`. Keep `KeyringAccountMonitor` for transaction discovery only.

**Tech Stack:** `@metamask/snaps-sdk@^11.2.0`, `@metamask/assets-controller@11.2.0`, `@metamask/messenger@^2.0.0`, existing Solana snap Jest suite.

**Spec:** `docs/superpowers/specs/2026-07-31-core-assets-controller-cutover-design.md`

## Global Constraints

- `@metamask/snaps-sdk` / `platformVersion`: `11.2.0`
- `@metamask/assets-controller`: `11.2.0`
- `@metamask/messenger`: `^2.0.0`
- Manifest messenger actions only: `AssetsController:getAsset`, `AssetsController:getAssets`
- No call site may use `coreMessenger` for assets — only `AssetsService`
- `getAccountAssetsByIDs` must use one `getAssets` call (not N× `getAsset`)
- `getAccountAssets` lists **all** Core assets for the account
- No Snap balance writes; no migration feature-flag stages
- Snap version bump: `2.8.0` → `2.9.0` (manifest + package.json files)

---

## File structure

| File | Responsibility |
|---|---|
| `packages/snap/src/types/core-messenger.ts` | Typed Core messenger actions |
| `packages/snap/src/core/services/assets/CoreAssetsAdapter.ts` | Messenger calls + `Asset` → `AssetEntity` mapping |
| `packages/snap/src/core/services/assets/AssetsService.ts` | Public facade (3 balance APIs + metadata/market) |
| `packages/snap/src/snapContext.ts` | `getMessenger`, wire adapter/service, drop repository |
| `packages/snap/snap.manifest.json` | SDK version, messenger endowment, snap version |
| Delete `AssetsRepository.ts` (+ test) | Snap balance persistence removed |

---

### Task 1: Platform bump + Core messenger types

**Files:**
- Create: `packages/snap/src/types/core-messenger.ts`
- Modify: `packages/snap/package.json`
- Modify: `package.json` (root `resolutions`)
- Modify: `packages/snap/snap.manifest.json`
- Modify: `packages/snap/CHANGELOG.md` (Unreleased)

**Interfaces:**
- Produces: `CoreMessenger`, `CoreMessengerCaller`, `CoreMessengerActions` (`AssetsControllerGetAssetAction | AssetsControllerGetAssetsAction`)

- [ ] **Step 1: Add messenger types**

Create `packages/snap/src/types/core-messenger.ts`:

```typescript
import type {
  AssetsControllerGetAssetAction,
  AssetsControllerGetAssetsAction,
} from '@metamask/assets-controller';
import type { Messenger } from '@metamask/messenger';
import type { AsyncMessenger } from '@metamask/snaps-sdk';

export type CoreMessengerActions =
  | AssetsControllerGetAssetAction
  | AssetsControllerGetAssetsAction;

/**
 * Typed messenger for Core controller actions available to this Snap via
 * `endowment:messenger` / `getMessenger`.
 */
export type CoreMessenger = Messenger<string, CoreMessengerActions>;

/**
 * Narrow dependency for services that only need to invoke Core actions.
 */
export type CoreMessengerCaller = Pick<AsyncMessenger<CoreMessenger>, 'call'>;
```

- [ ] **Step 2: Bump dependencies**

In `packages/snap/package.json`:
- `"version": "2.9.0"`
- `"@metamask/snaps-sdk": "^11.2.0"`
- `"@metamask/snaps-cli": "^8.4.1"`
- Add `"@metamask/assets-controller": "11.2.0"`
- Add `"@metamask/messenger": "^2.0.0"`

In root `package.json`:
- `"version": "2.9.0"` (if kept in sync)
- `"resolutions": { "@metamask/snaps-sdk": "^11.2.0", ... }`

In `packages/snap/snap.manifest.json`:
- `"version": "2.9.0"`
- `"platformVersion": "11.2.0"`
- Add under `initialPermissions`:

```json
"endowment:messenger": {
  "actions": [
    "AssetsController:getAsset",
    "AssetsController:getAssets"
  ]
}
```

Add CHANGELOG Unreleased notes for Core assets cutover + SDK 11.2.0.

- [ ] **Step 3: Install**

Run: `yarn install` from repo root  
Expected: lockfile updates; no peer errors blocking install.

- [ ] **Step 4: Commit**

```bash
git add packages/snap/src/types/core-messenger.ts packages/snap/package.json package.json packages/snap/snap.manifest.json packages/snap/CHANGELOG.md yarn.lock
git commit -m "$(cat <<'EOF'
chore: bump snaps-sdk to 11.2.0 and add Core messenger endowment

EOF
)"
```

---

### Task 2: `CoreAssetsAdapter` (TDD)

**Files:**
- Create: `packages/snap/src/core/services/assets/CoreAssetsAdapter.ts`
- Create: `packages/snap/src/core/services/assets/CoreAssetsAdapter.test.ts`

**Interfaces:**
- Consumes: `CoreMessengerCaller`
- Produces:
  - `getAccountAsset(accountId, assetId, accountAddress): Promise<AssetEntity | null>`
  - `getAccountAssets(accountId, accountAddress, chainIds): Promise<AssetEntity[]>`
  - `getAccountAssetsByIds(accountId, assetIds, accountAddress, chainIds): Promise<(AssetEntity | null)[]>`

Mapping rules:
- Native (`…/slip44:501`): `NativeAsset` with `address: accountAddress`
- Token (`…/token:Mint`): `TokenAsset` with `mint` from CAIP asset reference; `pubkey` = ATA via `findAssociatedTokenPda` with `TOKEN_PROGRAM_ADDRESS` (same pattern as `SendSplTokenBuilder`)
- `rawAmount` = `asset.balance.amount`; `uiAmount` = `fromTokenUnits(amount, decimals)`
- `decimals` / `symbol` from `asset.metadata` (fallback `UNKNOWN` / `0`)

- [ ] **Step 1: Write failing tests**

Create `CoreAssetsAdapter.test.ts` covering:
1. `getAccountAsset` calls `AssetsController:getAsset` and maps native SOL
2. Returns `null` when controller returns `undefined`
3. `getAccountAssets` calls `AssetsController:getAssets` once with `[{ id: accountId }]` and `chainIds`, maps all entries
4. `getAccountAssetsByIds` calls `getAssets` **once** (assert call count === 1), returns ordered array with `null` gaps

Example assert for batch:

```typescript
expect(mockCall).toHaveBeenCalledTimes(1);
expect(mockCall).toHaveBeenCalledWith(
  'AssetsController:getAssets',
  [{ id: accountId }],
  { chainIds },
);
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `yarn workspace @metamask/solana-wallet-snap test src/core/services/assets/CoreAssetsAdapter.test.ts`  
Expected: FAIL (module/class missing)

- [ ] **Step 3: Implement `CoreAssetsAdapter`**

```typescript
import type { Asset } from '@metamask/assets-controller';
import { parseCaipAssetType, type CaipAssetType } from '@metamask/utils';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { address as asAddress } from '@solana/kit';

import type { Network, NativeCaipAssetType, TokenCaipAssetType } from '../../constants/solana';
import { SolanaCaip19Tokens } from '../../constants/solana';
import type { AssetEntity } from '../../../entities';
import type { CoreMessengerCaller } from '../../../types/core-messenger';
import { fromTokenUnits } from '../../utils/fromTokenUnit';

export class CoreAssetsAdapter {
  readonly #coreMessenger: CoreMessengerCaller;

  constructor(coreMessenger: CoreMessengerCaller) {
    this.#coreMessenger = coreMessenger;
  }

  async getAccountAsset(
    accountId: string,
    assetId: string,
    accountAddress: string,
  ): Promise<AssetEntity | null> {
    const result = await this.#coreMessenger.call(
      'AssetsController:getAsset',
      accountId,
      assetId as Asset['id'],
    );
    if (!result) {
      return null;
    }
    return this.#mapAsset(accountId, assetId, accountAddress, result);
  }

  async getAccountAssets(
    accountId: string,
    accountAddress: string,
    chainIds: string[],
  ): Promise<AssetEntity[]> {
    const byAccount = await this.#coreMessenger.call(
      'AssetsController:getAssets',
      [{ id: accountId }],
      { chainIds },
    );
    const accountAssets = byAccount[accountId] ?? {};
    const entities: AssetEntity[] = [];
    for (const [assetId, asset] of Object.entries(accountAssets)) {
      entities.push(
        await this.#mapAsset(accountId, assetId, accountAddress, asset),
      );
    }
    return entities;
  }

  async getAccountAssetsByIds(
    accountId: string,
    assetIds: string[],
    accountAddress: string,
    chainIds: string[],
  ): Promise<(AssetEntity | null)[]> {
    const byAccount = await this.#coreMessenger.call(
      'AssetsController:getAssets',
      [{ id: accountId }],
      { chainIds },
    );
    const accountAssets = byAccount[accountId] ?? {};
    return Promise.all(
      assetIds.map(async (assetId) => {
        const asset = accountAssets[assetId];
        if (!asset) {
          return null;
        }
        return this.#mapAsset(accountId, assetId, accountAddress, asset);
      }),
    );
  }

  async #mapAsset(
    accountId: string,
    assetId: string,
    accountAddress: string,
    asset: Asset,
  ): Promise<AssetEntity> {
    const { chainId, assetNamespace, assetReference } = parseCaipAssetType(
      assetId as CaipAssetType,
    );
    const decimals = asset.metadata.decimals ?? 0;
    const symbol = asset.metadata.symbol ?? 'UNKNOWN';
    const rawAmount = asset.balance.amount;
    const uiAmount = fromTokenUnits(rawAmount, decimals);
    const network = chainId as Network;

    if (assetId.endsWith(SolanaCaip19Tokens.SOL)) {
      return {
        assetType: assetId as NativeCaipAssetType,
        keyringAccountId: accountId,
        network,
        address: accountAddress,
        symbol,
        decimals,
        rawAmount,
        uiAmount,
      };
    }

    const mint = assetReference;
    const [pubkey] = await findAssociatedTokenPda({
      mint: asAddress(mint),
      owner: asAddress(accountAddress),
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    return {
      assetType: assetId as TokenCaipAssetType,
      keyringAccountId: accountId,
      network,
      mint,
      pubkey,
      symbol,
      decimals,
      rawAmount,
      uiAmount,
    };
  }
}
```

Adjust imports to match repo path aliases / lint. If `getAssets` typing requires fuller account objects, cast `[{ id: accountId } as Pick<InternalAccount,'id'>]` or `as any` only at the call boundary with a short comment that state-read path only needs `id`.

- [ ] **Step 4: Run tests — expect PASS**

Run: `yarn workspace @metamask/solana-wallet-snap test src/core/services/assets/CoreAssetsAdapter.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/snap/src/core/services/assets/CoreAssetsAdapter.ts packages/snap/src/core/services/assets/CoreAssetsAdapter.test.ts
git commit -m "$(cat <<'EOF'
feat: add CoreAssetsAdapter for AssetsController reads

EOF
)"
```

---

### Task 3: Rewrite `AssetsService` public API (TDD)

**Files:**
- Modify: `packages/snap/src/core/services/assets/AssetsService.ts` (replace balance persistence with Core reads)
- Rewrite: `packages/snap/src/core/services/assets/AssetsService.test.ts`
- Modify: `packages/snap/src/core/services/assets/index.ts` (export adapter; stop exporting repository after Task 4)

**Interfaces:**
- Consumes: `CoreAssetsAdapter`, `AccountsService` (`findById`), `ConfigProvider` (active Solana chain IDs), `TokenApiClient`, `TokenPricesService`, `NftApiClient` (only if still used by metadata), `ILogger`
- Produces:
  - `getAccountAssetByID(accountId: string, assetId: string): Promise<AssetEntity | null>`
  - `getAccountAssetsByIDs(accountId: string, assetIds: string[]): Promise<(AssetEntity | null)[]>`
  - `getAccountAssets(accountId: string): Promise<AssetEntity[]>`
  - `getAssetsMetadata(...)` / `fetchAssetsMarketData(...)` (keep existing behavior)

Remove constructor deps: `AssetsRepository`, `SolanaConnection`, `ICache` (only used for token-account fetch).

- [ ] **Step 1: Write failing tests for the three balance methods**

Mock `CoreAssetsAdapter` + `AccountsService.findById` returning `{ id, address }`. Assert:
- Missing account → throw or return `[]`/`null` (pick **throw** with clear error for by-ID and list, consistent with Keyring `getAccountOrThrow` callers that already have the account — OR resolve address only when found; if `findById` null, return `null`/`[]`). **Decision:** if account missing → `getAccountAssetByID` returns `null`; `getAccountAssets` / `ByIDs` return `[]` / all `null`s.
- Methods forward to adapter with `account.address` and `chainIds` from `configProvider.get().activeNetworks` (or equivalent existing active network list).

- [ ] **Step 2: Run — expect FAIL**

Run: `yarn workspace @metamask/solana-wallet-snap test src/core/services/assets/AssetsService.test.ts`  
Expected: FAIL on new method names / constructor

- [ ] **Step 3: Implement slim `AssetsService`**

Keep `getAssetsMetadata` / `fetchAssetsMarketData` / `#splitAssetsByType` / `#getNativeTokensMetadata` (and NFT helper if still referenced). Delete `fetch`, `save`, `saveMany`, `getAll`, `findByAccount`, `hasChanged`, and private RPC fetch helpers.

Balance methods:

```typescript
async getAccountAssetByID(
  accountId: string,
  assetId: string,
): Promise<AssetEntity | null> {
  const account = await this.#accountsService.findById(accountId);
  if (!account) {
    return null;
  }
  return this.#coreAssetsAdapter.getAccountAsset(
    accountId,
    assetId,
    account.address,
  );
}

async getAccountAssets(accountId: string): Promise<AssetEntity[]> {
  const account = await this.#accountsService.findById(accountId);
  if (!account) {
    return [];
  }
  return this.#coreAssetsAdapter.getAccountAssets(
    accountId,
    account.address,
    this.#solanaChainIds(),
  );
}

async getAccountAssetsByIDs(
  accountId: string,
  assetIds: string[],
): Promise<(AssetEntity | null)[]> {
  const account = await this.#accountsService.findById(accountId);
  if (!account) {
    return assetIds.map(() => null);
  }
  return this.#coreAssetsAdapter.getAccountAssetsByIds(
    accountId,
    assetIds,
    account.address,
    this.#solanaChainIds(),
  );
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `yarn workspace @metamask/solana-wallet-snap test src/core/services/assets/AssetsService.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/snap/src/core/services/assets/AssetsService.ts packages/snap/src/core/services/assets/AssetsService.test.ts
git commit -m "$(cat <<'EOF'
feat: route AssetsService balance reads through Core

EOF
)"
```

---

### Task 4: Delete repository + `assetEntities` state

**Files:**
- Delete: `packages/snap/src/core/services/assets/AssetsRepository.ts`
- Delete: `packages/snap/src/core/services/assets/AssetsRepository.test.ts`
- Modify: `packages/snap/src/core/services/assets/index.ts`
- Modify: `packages/snap/src/core/services/state/State.ts`
- Modify any tests that seed `assetEntities` in state fixtures

- [ ] **Step 1: Remove `assetEntities` from state type + defaults**

In `State.ts`, remove `assetEntities` from `UnencryptedStateValue` and `DEFAULT_UNENCRYPTED_STATE`. Extend migration omit list to strip legacy keys:

```typescript
return omit(state as any, ['assets', 'assetEntities']);
```

(Apply wherever existing `omit(..., ['assets'])` runs — start/update/install paths.)

- [ ] **Step 2: Update barrel export**

```typescript
export * from './AssetsService';
export * from './CoreAssetsAdapter';
export * from './TokenHelper';
```

- [ ] **Step 3: Delete repository files**

- [ ] **Step 4: Fix compile breakages from deleted exports** (grep `AssetsRepository` / `assetEntities`)

Run: `yarn workspace @metamask/solana-wallet-snap lint:types`  
Expected: errors only in not-yet-rewired files (Keyring, Send, etc.) — note them for later tasks; if Task 4 is committed alone, either leave WIP or land Task 5 in same commit. **Prefer combining remaining type errors into Task 5 wiring if types fail hard.**

- [ ] **Step 5: Commit**

```bash
git add -u packages/snap/src/core/services/assets packages/snap/src/core/services/state/State.ts
git commit -m "$(cat <<'EOF'
refactor: remove AssetsRepository and assetEntities state

EOF
)"
```

---

### Task 5: Wire `snapContext`

**Files:**
- Modify: `packages/snap/src/snapContext.ts`

- [ ] **Step 1: Initialize messenger and rebuild `AssetsService`**

```typescript
import { getMessenger } from '@metamask/snaps-sdk';
import type { CoreMessenger } from './types/core-messenger';
import { CoreAssetsAdapter, AssetsService } from './core/services/assets';

const coreMessenger = getMessenger<CoreMessenger>();
const coreAssetsAdapter = new CoreAssetsAdapter(coreMessenger);

// accountsService must exist before assetsService
const assetsService = new AssetsService({
  logger,
  configProvider,
  accountsService,
  coreAssetsAdapter,
  tokenApiClient,
  tokenPricesService,
  nftApiClient,
});
```

Remove `new AssetsRepository(state)`. Reorder declarations so `accountsService` is constructed before `assetsService`. Keep injecting `assetsService` into TransactionMapper, TransactionsService, AccountsSynchronizer, KeyringAccountMonitor, Keyring, SendService.

- [ ] **Step 2: Typecheck context**

Run: `yarn workspace @metamask/solana-wallet-snap lint:types`  
Expected: remaining errors only in consumers still on old methods.

- [ ] **Step 3: Commit**

```bash
git add packages/snap/src/snapContext.ts
git commit -m "$(cat <<'EOF'
feat: initialize Core messenger and wire CoreAssetsAdapter

EOF
)"
```

---

### Task 6: Rewire Keyring balance APIs

**Files:**
- Modify: `packages/snap/src/core/handlers/onKeyringRequest/Keyring.ts`
- Modify: `packages/snap/src/core/handlers/onKeyringRequest/Keyring.test.ts`

- [ ] **Step 1: Update failing tests first**

Replace `findByAccount` mocks with:
- `listAccountAssets` → `getAccountAssets`
- `getAccountBalances` → `getAccountAssetsByIDs`

- [ ] **Step 2: Implement**

`listAccountAssets`:

```typescript
const assetEntities = await this.#assetsService.getAccountAssets(accountId);
// keep existing zero-balance filter for non-native
```

`getAccountBalances`:

```typescript
const assetsToUse = (
  await this.#assetsService.getAccountAssetsByIDs(accountId, assets)
).filter((asset): asset is NonNullable<typeof asset> => asset !== null)
  .filter(/* existing zero-balance filter */);
```

- [ ] **Step 3: Run Keyring tests**

Run: `yarn workspace @metamask/solana-wallet-snap test src/core/handlers/onKeyringRequest/Keyring.test.ts`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/snap/src/core/handlers/onKeyringRequest/Keyring.ts packages/snap/src/core/handlers/onKeyringRequest/Keyring.test.ts
git commit -m "$(cat <<'EOF'
refactor: read keyring account assets from Core via AssetsService

EOF
)"
```

---

### Task 7: Rewire Send flow

**Files:**
- Modify: `packages/snap/src/core/services/send/SendService.ts`
- Modify: `packages/snap/src/core/services/send/SendService.test.ts`
- Modify: `packages/snap/src/features/send/render.tsx`
- Modify: `packages/snap/src/features/send/render.test.tsx`
- Modify: `packages/snap/src/core/handlers/onCronjob/backgroundEvents/refreshSend.tsx`

- [ ] **Step 1: `SendService.onAmountInput`**

Replace `findByAccount` with:

```typescript
const nativeAssetType = Networks[scope].nativeToken.caip19Id;
const [assetEntry, nativeAsset] = await this.#assetsService.getAccountAssetsByIDs(
  accountId,
  [assetId, nativeAssetType],
);
```

Update tests accordingly.

- [ ] **Step 2: `render.tsx` — replace `getAll()`**

```typescript
const keyringAccounts = await accountsService.getAll();
const assetEntities = (
  await Promise.all(
    keyringAccounts.map((account) =>
      assetsService.getAccountAssets(account.id),
    ),
  )
).flat();
```

Keep `getAssetsMetadata` for selected token metadata.

- [ ] **Step 3: `refreshSend.tsx`**

Same aggregation pattern (via `accountsService.getAll()` + `getAccountAssets`), or if interface context has `fromAccountId`, prefer `getAccountAssets(fromAccountId)` plus assets needed for prices from context. Minimal correct approach: load all accounts’ assets like render.

- [ ] **Step 4: Run send tests**

Run: `yarn workspace @metamask/solana-wallet-snap test src/core/services/send/SendService.test.ts src/features/send/render.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/snap/src/core/services/send packages/snap/src/features/send packages/snap/src/core/handlers/onCronjob/backgroundEvents/refreshSend.tsx
git commit -m "$(cat <<'EOF'
refactor: send flow reads balances from Core via AssetsService

EOF
)"
```

---

### Task 8: `AccountsSynchronizer` — transactions only

**Files:**
- Modify: `packages/snap/src/core/services/accounts/AccountsSynchronizer.ts`
- Add/update tests if present; otherwise cover via existing integration-style tests

- [ ] **Step 1: Rewrite `synchronize`**

```typescript
async synchronize(accounts?: SolanaKeyringAccount[]): Promise<void> {
  const accountsToSync = accounts ?? (await this.#accountsService.getAll());
  this.#logger.info('Synchronizing accounts', accountsToSync);

  const assets = (
    await Promise.allSettled(
      accountsToSync.map(async (account) =>
        this.#assetsService.getAccountAssets(account.id),
      ),
    )
  )
    .map((item) => (item.status === 'fulfilled' ? item.value : []))
    .flat();

  // No asset saveMany — Core owns balances

  const transactions =
    await this.#transactionsService.fetchAssetsTransactions(assets, {
      limit: 20,
    });

  await this.#transactionsService.saveMany(transactions);
}
```

- [ ] **Step 2: Run related tests / typecheck**

Run: `yarn workspace @metamask/solana-wallet-snap lint:types`  
Expected: no errors referencing `fetch`/`saveMany` on assets

- [ ] **Step 3: Commit**

```bash
git add packages/snap/src/core/services/accounts/AccountsSynchronizer.ts
git commit -m "$(cat <<'EOF'
refactor: sync transactions from Core asset list without Snap asset writes

EOF
)"
```

---

### Task 9: Strip asset writes from `KeyringAccountMonitor`

**Files:**
- Modify: `packages/snap/src/core/services/subscriptions/KeyringAccountMonitor.ts`
- Modify: `packages/snap/src/core/services/subscriptions/KeyringAccountMonitor.test.ts`
- Modify: `packages/snap/src/snapContext.ts` (drop `assetsService` ctor arg if unused)

- [ ] **Step 1: Update tests** — assert `save` never called; causing-tx path still invoked

- [ ] **Step 2: Implement**

In `#handleAccountNotification` / `#handleProgramNotification`:
- Remove `this.#assetsService.save(...)`
- Remove `getAssetsMetadata` used only for save symbol
- Keep `this.#saveCausingTransaction(...)`

If `assetsService` is unused after that, remove field + constructor param + `snapContext` argument.

- [ ] **Step 3: Run monitor tests**

Run: `yarn workspace @metamask/solana-wallet-snap test src/core/services/subscriptions/KeyringAccountMonitor.test.ts`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/snap/src/core/services/subscriptions/KeyringAccountMonitor.ts packages/snap/src/core/services/subscriptions/KeyringAccountMonitor.test.ts packages/snap/src/snapContext.ts
git commit -m "$(cat <<'EOF'
refactor: KeyringAccountMonitor persists transactions only

EOF
)"
```

---

### Task 10: Remaining consumers + full verification

**Files:**
- `TransactionMapper` / `TransactionsService` — keep `getAssetsMetadata` (already correct)
- `onAssetsLookup` / `onAssetsMarketData` — unchanged
- Grep cleanup: `findByAccount|getAll\(|\.save\(|\.saveMany\(|AssetsRepository|assetEntities`

- [ ] **Step 1: Grep for leftovers**

Run:

```bash
rg -n "findByAccount|assetsService\.getAll|AssetsRepository|assetEntities|#assetsService\.save|assetsService\.fetch\(" packages/snap/src
```

Expected: no production references (tests only if intentionally historical — prefer zero).

- [ ] **Step 2: Full snap test suite**

Run: `yarn workspace @metamask/solana-wallet-snap test`  
Expected: PASS (fix any broken mocks still using old API)

- [ ] **Step 3: Types + lint**

Run: `yarn workspace @metamask/solana-wallet-snap lint:types`  
Run: `yarn workspace @metamask/solana-wallet-snap lint:eslint`  
Expected: PASS

- [ ] **Step 4: Rebuild snap (updates manifest shasum)**

Run: `yarn workspace @metamask/solana-wallet-snap build`  
Expected: `snap.manifest.json` shasum refreshed; commit if changed.

- [ ] **Step 5: Final commit**

```bash
git add -u
git commit -m "$(cat <<'EOF'
chore: finish Core assets cutover cleanup and verify build

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|---|---|
| SDK / platform 11.2.0 + messenger endowment | 1 |
| `getMessenger` + types | 1, 5 |
| `getAccountAssetByID` → `getAsset` | 2, 3 |
| `getAccountAssets` → full list via `getAssets` | 2, 3 |
| `getAccountAssetsByIDs` → single `getAssets` | 2, 3 |
| All reads via `AssetsService` | 3, 5–8 |
| Delete repository / `assetEntities` | 4 |
| Keyring / Send / refreshSend rewires | 6, 7 |
| AccountsSynchronizer no asset writes | 8 |
| KeyringAccountMonitor txs only | 9 |
| Metadata / market unchanged | 3 (keep methods), 10 |
| Tests updated | 2, 3, 6, 7, 9, 10 |

## Placeholder / consistency self-review

- Method names use Tron spelling: `getAccountAssetByID`, `getAccountAssetsByIDs`, `getAccountAssets`
- Adapter uses `getAccountAssetsByIds` (Ids) internally; service uses `ByIDs` — keep that split consistent in code
- No feature-flag / RemoteFeatureFlagController (unlike Tron)
- Token-2022 ATA caveat: mapper uses `TOKEN_PROGRAM_ADDRESS`; if Token-2022 pubkeys are required later, extend mapping — do not block cutover
