# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.31.2]

### Uncategorized

- fix: transaction scan messages ([#401](https://github.com/MetaMask/snap-solana-wallet/pull/401))
- feat: disable continue button on scan error ([#400](https://github.com/MetaMask/snap-solana-wallet/pull/400))
- chore: svg image size fix ([#397](https://github.com/MetaMask/snap-solana-wallet/pull/397))
- chore: improves messages ([#367](https://github.com/MetaMask/snap-solana-wallet/pull/367))

## [1.31.1]

### Fixed

- Remove lifecycle update ([#393](https://github.com/MetaMask/snap-solana-wallet/pull/393))
- Match storage limit with expected page size for transactions coming from the snap ([#392](https://github.com/MetaMask/snap-solana-wallet/pull/392))

## [1.31.0]

### Added

- Enable `getMinimumBalanceForRentExemption` ([#360](https://github.com/MetaMask/snap-solana-wallet/pull/360))
- New translations ([#348](https://github.com/MetaMask/snap-solana-wallet/pull/348))

### Changed

- Restore max button in send flow ([#384](https://github.com/MetaMask/snap-solana-wallet/pull/384))
- Remove additional get context on refresh send ([#385](https://github.com/MetaMask/snap-solana-wallet/pull/385))
- Clean up `AssetService` ([#380](https://github.com/MetaMask/snap-solana-wallet/pull/380))

### Fixed

- Decrease non-active cronjob time to 30min ([#390](https://github.com/MetaMask/snap-solana-wallet/pull/390))
- Prevent inactive client from executing cronjobs ([#388](https://github.com/MetaMask/snap-solana-wallet/pull/388))
- Prevent empty accounts from refreshing ([#387](https://github.com/MetaMask/snap-solana-wallet/pull/387))
- Fix number formatting when locale is composed ([#382](https://github.com/MetaMask/snap-solana-wallet/pull/382))
- Changing asset in the Send flow disabled Continue button ([#374](https://github.com/MetaMask/snap-solana-wallet/pull/374))

## [1.30.4]

### Fixed

- Spread cronjob load time randomly per user ([#379](https://github.com/MetaMask/snap-solana-wallet/pull/379))

## [1.30.3]

### Fixed

- Rollback send state ([#375](https://github.com/MetaMask/snap-solana-wallet/pull/375))

## [1.30.2]

### Fixed

- Hotfix: get balances ([#372](https://github.com/MetaMask/snap-solana-wallet/pull/372))
- Add spam failed transaction case to the mapping tests ([#371](https://github.com/MetaMask/snap-solana-wallet/pull/371))

## [1.30.1]

### Fixed

- Rollback `fungible` check ([#369](https://github.com/MetaMask/snap-solana-wallet/pull/369))

## [1.30.0]

### Changed

- Replace `refreshAssets` and `refreshTransactions` with `refreshAccounts` ([#365](https://github.com/MetaMask/snap-solana-wallet/pull/365))
- Optimize get account balances ([#364](https://github.com/MetaMask/snap-solana-wallet/pull/364))

### Fixed

- Set correct fungible flag using quick check ([#363](https://github.com/MetaMask/snap-solana-wallet/pull/363))

## [1.29.0]

### Changed

- `snap_manageState` to `snap_setState` ([#359](https://github.com/MetaMask/snap-solana-wallet/pull/359))

### Fixed

- Transaction confirmation loading button while fetching icon ([#361](https://github.com/MetaMask/snap-solana-wallet/pull/361))

## [1.28.3]

### Fixed

- More transaction mapping inaccuracies ([#349](https://github.com/MetaMask/snap-solana-wallet/pull/349))
- Temporarily hide "max"' button in send form ([#356](https://github.com/MetaMask/snap-solana-wallet/pull/356))

## [1.28.2]

### Fixed

- Block to address until data is ready on send ([#354](https://github.com/MetaMask/snap-solana-wallet/pull/354))

## [1.28.1]

### Changed

- Simplify mapping fee ([#347](https://github.com/MetaMask/snap-solana-wallet/pull/347))

### Fixed

- Send form address input not triggering amount pickup ([#352](https://github.com/MetaMask/snap-solana-wallet/pull/352))
- Fully respect `activeNetworks` set in the ConfigProvider ([#351](https://github.com/MetaMask/snap-solana-wallet/pull/351))
- `createAccount` idempotency ([#350](https://github.com/MetaMask/snap-solana-wallet/pull/350))

## [1.28.0]

### Added

- New translations ([#344](https://github.com/MetaMask/snap-solana-wallet/pull/344))

### Fixed

- Disabled Devnet ([#343](https://github.com/MetaMask/snap-solana-wallet/pull/343))
- Transaction mapping ([#343](https://github.com/MetaMask/snap-solana-wallet/pull/343))

## [1.27.0]

### Fixed

- Decrease cache time to a minute ([#341](https://github.com/MetaMask/snap-solana-wallet/pull/341))

## [1.26.1]

### Fixed

- Transaction after interaction ([#339](https://github.com/MetaMask/snap-solana-wallet/pull/339))
- Make `marketCap` optional ([#338](https://github.com/MetaMask/snap-solana-wallet/pull/338))

## [1.26.0]

### Added

- Integrate `AssetSelector` in Send ([#336](https://github.com/MetaMask/snap-solana-wallet/pull/336))

### Fixed

- Provide skeleton width ([#335](https://github.com/MetaMask/snap-solana-wallet/pull/335))
- Add "all" time range to historical prices ([#333](https://github.com/MetaMask/snap-solana-wallet/pull/333))

## [1.25.1]

### Fixed

- Bring back clear button to `ToAddress` ([#331](https://github.com/MetaMask/snap-solana-wallet/pull/331))

## [1.25.0]

### Added

- Add transactions scanning after signing a transaction in case it gets broadcast by dApps ([#324](https://github.com/MetaMask/snap-solana-wallet/pull/324))
- Hide spam transactions with status `failed` ([#322](https://github.com/MetaMask/snap-solana-wallet/pull/322))

### Changed

- Improved typing performance ([#321](https://github.com/MetaMask/snap-solana-wallet/pull/321))
- Move accounts to non-encrypted state ([#326](https://github.com/MetaMask/snap-solana-wallet/pull/326))
- Simplify SPL Tokens send instructions ([#323](https://github.com/MetaMask/snap-solana-wallet/pull/323))

### Fixed

- Filter out assets received by other addresses when a transaction is a Receive ([#325](https://github.com/MetaMask/snap-solana-wallet/pull/325))

## [1.24.0]

### Added

- Automatically hide spam tokens from the transaction history ([#317](https://github.com/MetaMask/snap-solana-wallet/pull/317))

### Changed

- Add transport without `x-bigtable` ([#318](https://github.com/MetaMask/snap-solana-wallet/pull/318))

### Fixed

- Pass request options in solana wallet methods ([#315](https://github.com/MetaMask/snap-solana-wallet/pull/315))

## [1.23.0]

### Added

- Account creation with configurable derivation path ([#311](https://github.com/MetaMask/snap-solana-wallet/pull/311))

### Fixed

- Throw appropriate error when user rejects a request ([#312](https://github.com/MetaMask/snap-solana-wallet/pull/312))
- Error message not formatted properly when cancelling a transaction from a dApp ([#309](https://github.com/MetaMask/snap-solana-wallet/pull/309))

## [1.22.0]

### Added

- Account creation is now idempotent ([#306](https://github.com/MetaMask/snap-solana-wallet/pull/306))

### Fixed

- Use the proper entropy when signing transactions ([#305](https://github.com/MetaMask/snap-solana-wallet/pull/305))
- Properly export the handler `onAssetHistoricalPrice` ([#305](https://github.com/MetaMask/snap-solana-wallet/pull/305))

## [1.21.0]

### Added

- Support sending Token2022 SPL tokens ([#285](https://github.com/MetaMask/snap-solana-wallet/pull/285))
- Support `onAssetHistoricalPrice` to return price chart ([#300](https://github.com/MetaMask/snap-solana-wallet/pull/300))

### Changed

- Make `entropySource` optional when creating a Solana account ([#299](https://github.com/MetaMask/snap-solana-wallet/pull/299))

### Fixed

- Simplify caching ([#302](https://github.com/MetaMask/snap-solana-wallet/pull/302))
- Validate that SOL balance is > 0 to cover transaction fees before simulation ([#303](https://github.com/MetaMask/snap-solana-wallet/pull/303))

## [1.20.0]

### Added

- `onAssetsConversion` now suports market data ([#291](https://github.com/MetaMask/snap-solana-wallet/pull/291))
- Add header for RPC latency ([#295](https://github.com/MetaMask/snap-solana-wallet/pull/295))

### Fixed

- Support estimating compute units limit for tailing transactions ([#297](https://github.com/MetaMask/snap-solana-wallet/pull/297))

## [1.19.0]

### Added

- Automatically add priority fee and compute budget instructions ([#290](https://github.com/MetaMask/snap-solana-wallet/pull/290), [#288](https://github.com/MetaMask/snap-solana-wallet/pull/288))
- Map `TransferChecked` ([#280](https://github.com/MetaMask/snap-solana-wallet/pull/280))
- Include market data when fetching spot prices ([#272](https://github.com/MetaMask/snap-solana-wallet/pull/272))

### Changed

- Bump keyring api + map unknown tx type ([#292](https://github.com/MetaMask/snap-solana-wallet/pull/292))
- Alternative background in SendForm ([#289](https://github.com/MetaMask/snap-solana-wallet/pull/289))
- Transaction `skipPreflight` ([#287](https://github.com/MetaMask/snap-solana-wallet/pull/287))

### Fixed

- Error message for account creation ([#286](https://github.com/MetaMask/snap-solana-wallet/pull/286))

## [1.18.1]

### Changed

- Make state support non-json-serializable data ([#283](https://github.com/MetaMask/snap-solana-wallet/pull/283))

### Removed

- Remove the unnecessary `PositiveNumberStruct` ([#278](https://github.com/MetaMask/snap-solana-wallet/pull/278))

### Fixed

- `getLowestUnusedIndex` should consider SRPs in the check ([#282](https://github.com/MetaMask/snap-solana-wallet/pull/282))
- Prevent rounding errors during validation of amount ([#281](https://github.com/MetaMask/snap-solana-wallet/pull/281))

## [1.18.0]

### Added

- Keyring `discoverAccounts` ([#274](https://github.com/MetaMask/snap-solana-wallet/pull/274))
- Support for `Token2022` program assets ([#275](https://github.com/MetaMask/snap-solana-wallet/pull/275))

### Fixed

- Partially sign transaction ([#276](https://github.com/MetaMask/snap-solana-wallet/pull/276))

## [1.17.0]

### Added

- Add `getLatestBlockhash` protocol request ([#271](https://github.com/MetaMask/snap-solana-wallet/pull/271))
- Add optional `assetId` to send flow ([#270](https://github.com/MetaMask/snap-solana-wallet/pull/270))

## [1.16.1]

### Fixed

- `signIn` message formatting ([#268](https://github.com/MetaMask/snap-solana-wallet/pull/268))

## [1.16.0]

### Added

- Forward `MetaMaskOptions` in `keyring_createAccount` method ([#266](https://github.com/MetaMask/snap-solana-wallet/pull/266))

## [1.15.1]

### Changed

- Move to solscan ([#264](https://github.com/MetaMask/snap-solana-wallet/pull/264))

## [1.15.0]

### Added

- Use new snap MetaMask preferences ([#258](https://github.com/MetaMask/snap-solana-wallet/pull/258))

### Changed

- Move state to unencrypted ([#261](https://github.com/MetaMask/snap-solana-wallet/pull/261))
- Upgrade `@solana/web3.js` to `@solana/kit` ([#259](https://github.com/MetaMask/snap-solana-wallet/pull/259))

### Fixed

- Transaction decoding for `Message` and `Transaction` ([#262](https://github.com/MetaMask/snap-solana-wallet/pull/262))

## [1.14.0]

### Added

- New transaltions ([#257](https://github.com/MetaMask/snap-solana-wallet/pull/257))
- Warn on bad account in confirm `signIn` ([#256](https://github.com/MetaMask/snap-solana-wallet/pull/256))
- Confirmation UI for `signTransaction` ([#251](https://github.com/MetaMask/snap-solana-wallet/pull/251))
- Confirmation UI for `signIn` and `signMessage` ([#247](https://github.com/MetaMask/snap-solana-wallet/pull/247))

### Fixed

- Correct expected parameter shape for `resolveAccountAddress` ([#254](https://github.com/MetaMask/snap-solana-wallet/pull/254))
- Assets wipe up by the cronjob ([#253](https://github.com/MetaMask/snap-solana-wallet/pull/253))
- Fee estimation in confirm tx request ([#252](https://github.com/MetaMask/snap-solana-wallet/pull/252))
- Mapping differences between Send, Receive and Swap transactions ([#250](https://github.com/MetaMask/snap-solana-wallet/pull/250))

## [1.13.0]

### Added

- New translations ([#244](https://github.com/MetaMask/snap-solana-wallet/pull/244))
- Substract rent from max amount + improve validation on amount f… ([#243](https://github.com/MetaMask/snap-solana-wallet/pull/243))

### Fixed

- Show amount for self and failed transactions ([#240](https://github.com/MetaMask/snap-solana-wallet/pull/240))
- Transaction updates not showing asset units ([#245](https://github.com/MetaMask/snap-solana-wallet/pull/245))

## [1.12.0]

### Added

- `Sign{Message/Transaction/In}` backend ([#241](https://github.com/MetaMask/snap-solana-wallet/pull/241))
- Analytics service ([#236](https://github.com/MetaMask/snap-solana-wallet/pull/236))

### Fixed

- Add validation to `getGenesisHash` request ([#239](https://github.com/MetaMask/snap-solana-wallet/pull/239))

## [1.11.0]

### Added

- New translations ([#234](https://github.com/MetaMask/snap-solana-wallet/pull/234))

### Fixed

- Reduce send delay ([#233](https://github.com/MetaMask/snap-solana-wallet/pull/233))
- Put instructions back on confirmation ([#230](https://github.com/MetaMask/snap-solana-wallet/pull/230))

## [1.10.1]

### Added

- Support for failed transactions ([#224](https://github.com/MetaMask/snap-solana-wallet/pull/224))

### Removed

- Lifecycle hooks permissions ([#226](https://github.com/MetaMask/snap-solana-wallet/pull/226))

## [1.10.0]

### Added

- Update balances post transaction ([#208](https://github.com/MetaMask/snap-solana-wallet/pull/208))

### Fixed

- Account keeps incrementing after rejecting add account ([#222](https://github.com/MetaMask/snap-solana-wallet/pull/222))
- Loss of precision on transfer amounts ([#219](https://github.com/MetaMask/snap-solana-wallet/pull/219))
- Solve race condition when simulating transaction in send form ([#221](https://github.com/MetaMask/snap-solana-wallet/pull/221))

## [1.9.0]

### Added

- New translations languages ([#126](https://github.com/MetaMask/snap-solana-wallet/pull/126))
- Support for `swap` transactions ([#214](https://github.com/MetaMask/snap-solana-wallet/pull/214))
- Support explicit `accountNameSuggestion` on `createAccount` ([#207](https://github.com/MetaMask/snap-solana-wallet/pull/207))
- Use `minimumBalanceForRentExemption` to send SOL ([#215](https://github.com/MetaMask/snap-solana-wallet/pull/215))

### Fixed

- Allowing accounts to request `submitRequest` methods ([#218](https://github.com/MetaMask/snap-solana-wallet/pull/218))

## [1.8.0]

### Added

- Pulg send flow to `signAndSendTransaction` ([#212](https://github.com/MetaMask/snap-solana-wallet/pull/212))
- Add confirmation before submit request ([#209](https://github.com/MetaMask/snap-solana-wallet/pull/209))
- Add estimated changes to confirmation ([#210](https://github.com/MetaMask/snap-solana-wallet/pull/210))

### Fixed

- Fiat fee in send confirmation ([#211](https://github.com/MetaMask/snap-solana-wallet/pull/211))
- Multiple send bug fixes ([#200](https://github.com/MetaMask/snap-solana-wallet/pull/200))

## [1.7.0]

### Added

- Enable SIP-26 `onProtocolRequest` ([#205](https://github.com/MetaMask/snap-solana-wallet/pull/205))
- Mock `wallet-standard` methods ([#204](https://github.com/MetaMask/snap-solana-wallet/pull/204))
- Emit keyring event after sending a transaction ([#203](https://github.com/MetaMask/snap-solana-wallet/pull/203))
- Implement `getFeeForTransaction` RPC request ([#201](https://github.com/MetaMask/snap-solana-wallet/pull/201))
- Added `sendAndConfirmTransaction` confirmation ([#183](https://github.com/MetaMask/snap-solana-wallet/pull/183))

### Changed

- Update devnet url ([#202](https://github.com/MetaMask/snap-solana-wallet/pull/202))
- Improve unit tests for execution ([#199](https://github.com/MetaMask/snap-solana-wallet/pull/199))

## [1.6.0]

### Added

- Support conversions for all supported assets ([#181](https://github.com/MetaMask/snap-solana-wallet/pull/181))

### Fixed

- Remove assets data for deleted accounts ([#196](https://github.com/MetaMask/snap-solana-wallet/pull/196))
- Concurrent state updates ([#195](https://github.com/MetaMask/snap-solana-wallet/pull/195))
- Speed up Solana key derivation ([#191](https://github.com/MetaMask/snap-solana-wallet/pull/191))
- Update returned account ([#193](https://github.com/MetaMask/snap-solana-wallet/pull/193))

## [1.5.0]

### Added

- Script to dynamically change the manifest file ([#177](https://github.com/MetaMask/snap-solana-wallet/pull/177))

### Changed

- Audit: Use encrypted state to store user information ([#178](https://github.com/MetaMask/snap-solana-wallet/pull/178))
- Derive Account private keys on demand ([#187](https://github.com/MetaMask/snap-solana-wallet/pull/187))

#### Removed

- `onUpdate` and `onInstall` handlers ([#186](https://github.com/MetaMask/snap-solana-wallet/pull/186))

### Fixed

- Audit: Pin dependency versions ([#189](https://github.com/MetaMask/snap-solana-wallet/pull/189)) and ([#185](https://github.com/MetaMask/snap-solana-wallet/pull/185))
- Audit: Potential url injections in api calls ([#182](https://github.com/MetaMask/snap-solana-wallet/pull/182))
- Audit: Unnecessary `tsx` extension on the snap's entry point file ([#180](https://github.com/MetaMask/snap-solana-wallet/pull/180))
- Audit: LAX or missing runtime input validation ([#179](https://github.com/MetaMask/snap-solana-wallet/pull/179))
- Bump `keyring-snap-sdk` version to enable the dispatcher ([#188](https://github.com/MetaMask/snap-solana-wallet/pull/188))

## [1.4.0]

### Added

- Implement `resolveAccountAddress` ([#175](https://github.com/MetaMask/snap-solana-wallet/pull/175))
- Implement push based transactions list ([#157](https://github.com/MetaMask/snap-solana-wallet/pull/157))
- Parity with compiled transactions ([#169](https://github.com/MetaMask/snap-solana-wallet/pull/169))

### Changed

- Update on snap permissions ([#172](https://github.com/MetaMask/snap-solana-wallet/pull/172))
- Improve env ([#171](https://github.com/MetaMask/snap-solana-wallet/pull/171))
- Transaction simulation to input change ([#168](https://github.com/MetaMask/snap-solana-wallet/pull/168))

### Fixed

- Transactions data flow problems ([#174](https://github.com/MetaMask/snap-solana-wallet/pull/174))
- Latency on send flow updates ([#173](https://github.com/MetaMask/snap-solana-wallet/pull/173))
- Conversions currency to lowercase ([#167](https://github.com/MetaMask/snap-solana-wallet/pull/167))
- Disable buttons until prices and balances are available ([#166](https://github.com/MetaMask/snap-solana-wallet/pull/166))

## [1.3.0]

### Added

- Integrate platform apis ([#162](https://github.com/MetaMask/snap-solana-wallet/pull/162))
- Hide network fee price when no prices ([#164](https://github.com/MetaMask/snap-solana-wallet/pull/164))
- Can send tokens even when price fetch fails ([#161](https://github.com/MetaMask/snap-solana-wallet/pull/161))
- SIP-29 handlers ([#159](https://github.com/MetaMask/snap-solana-wallet/pull/159))
- onInstall handler ([#145](https://github.com/MetaMask/snap-solana-wallet/pull/145))
- Update assets events ([#158](https://github.com/MetaMask/snap-solana-wallet/pull/158))
- Switch order of fields on send ([#154](https://github.com/MetaMask/snap-solana-wallet/pull/154))
- Sip29 in rpc ([#153](https://github.com/MetaMask/snap-solana-wallet/pull/153))

### Fixed

- Clicking on max when balance is zero ([#155](https://github.com/MetaMask/snap-solana-wallet/pull/155))
- Transactions list request had improper validation ([#156](https://github.com/MetaMask/snap-solana-wallet/pull/156))

## [1.2.0]

### Added

- Format tokens to the decimal ([#150](https://github.com/MetaMask/snap-solana-wallet/pull/150))
- Add coverage for the transactions cronjob ([#149](https://github.com/MetaMask/snap-solana-wallet/pull/149))
- Add tests for the transactions history feature ([#143](https://github.com/MetaMask/snap-solana-wallet/pull/143))
- Send SPL tokens on send flow ([#144](https://github.com/MetaMask/snap-solana-wallet/pull/144))
- Adds onUpdate hook ([#131](https://github.com/MetaMask/snap-solana-wallet/pull/131))
- Snap send SPL tokens transaction ([#130](https://github.com/MetaMask/snap-solana-wallet/pull/130))
- Add SPL token transaction parsing ([#124](https://github.com/MetaMask/snap-solana-wallet/pull/124))

### Fixed

- Validating all keyring I/O ([#151](https://github.com/MetaMask/snap-solana-wallet/pull/151))
- Can progress on send when amount is empty ([#148](https://github.com/MetaMask/snap-solana-wallet/pull/148))
- Chunk token metadata requests ([#147](https://github.com/MetaMask/snap-solana-wallet/pull/147))
- Allow token metadata service to fetch from tokens from different networks at the same time ([#146](https://github.com/MetaMask/snap-solana-wallet/pull/146))
- Expose buildTransactionMessage + base64 encoder / decoder ([#142](https://github.com/MetaMask/snap-solana-wallet/pull/142))

## [1.1.0]

### Added

- Add `scopes` field to `KeyringAccount` ([#134](https://github.com/MetaMask/snap-solana-wallet/pull/134))
- Add support for spanish translations ([#127](https://github.com/MetaMask/snap-solana-wallet/pull/127))
- New Crowdin translations by Github Action ([#121](https://github.com/MetaMask/snap-solana-wallet/pull/121))
- List account assets ([#125](https://github.com/MetaMask/snap-solana-wallet/pull/125))
- Get transaction fee ([#123](https://github.com/MetaMask/snap-solana-wallet/pull/123))

### Changed

- Check client status for running cronjobs ([#128](https://github.com/MetaMask/snap-solana-wallet/pull/128))

## [1.0.4]

### Added

- feat: add `keyring_listAccountTransactions` support to the snap ([#101](https://github.com/MetaMask/snap-solana-wallet/pull/101))
- New Crowdin translations by Github Action ([#96](https://github.com/MetaMask/snap-solana-wallet/pull/96))
- feat: localised currency ([#118](https://github.com/MetaMask/snap-solana-wallet/pull/118))
- feat: add retry logic globally to all RPC calls ([#113](https://github.com/MetaMask/snap-solana-wallet/pull/113))
- feat: failover rpc ([#115](https://github.com/MetaMask/snap-solana-wallet/pull/115))
- feat: snap show loader for pending txs ([#117](https://github.com/MetaMask/snap-solana-wallet/pull/117))

### Changed

- fix: remove all logging from prod ([#120](https://github.com/MetaMask/snap-solana-wallet/pull/120))
- fix: remove logging ([#119](https://github.com/MetaMask/snap-solana-wallet/pull/119))
- fix: balance validation not triggering + send tests ([#116](https://github.com/MetaMask/snap-solana-wallet/pull/116))
- fix: to address links to from in explorer ([#114](https://github.com/MetaMask/snap-solana-wallet/pull/114))
- fix: scope passed to send form ([#112](https://github.com/MetaMask/snap-solana-wallet/pull/112))
- fix: make building the send context robust to errors ([#111](https://github.com/MetaMask/snap-solana-wallet/pull/111))

## [1.0.3]

### Added

- feat: add a component that wraps the send flow ([#106](https://github.com/MetaMask/snap-solana-wallet/pull/106))
- feat: snap get live token rates ([#102](https://github.com/MetaMask/snap-solana-wallet/pull/102))
- feat: localize ui ([#99](https://github.com/MetaMask/snap-solana-wallet/pull/99))
- feat: Adds the Tx result view after confirming it ([#92](https://github.com/MetaMask/snap-solana-wallet/pull/92))

### Changed

- fix: the tx confirmation result view now uses price from the tx time ([#107](https://github.com/MetaMask/snap-solana-wallet/pull/107))
- fix: compile error ([#104](https://github.com/MetaMask/snap-solana-wallet/pull/104))
- fix: show address name in confirmation ([#105](https://github.com/MetaMask/snap-solana-wallet/pull/105))
- fix: confirmation result ([#103](https://github.com/MetaMask/snap-solana-wallet/pull/103))
- chore: clean up dependencies object ([#98](https://github.com/MetaMask/snap-solana-wallet/pull/98))
- chore: updates translations ([#100](https://github.com/MetaMask/snap-solana-wallet/pull/100))

## [1.0.2]

### Added

- feat: connect 'Initiate Transfer' and 'Confirmation' dialogs together ([#84](https://github.com/MetaMask/snap-solana-wallet/pull/84))
- feat: setup translations ([#86](https://github.com/MetaMask/snap-solana-wallet/pull/86))

## [1.0.1]

### Added

- docs: document the .env ([#87](https://github.com/MetaMask/snap-solana-wallet/pull/87))
- [SOL-58] snap mock rpc calls for unit tests ([#85](https://github.com/MetaMask/snap-solana-wallet/pull/85))
- feat: amount input ([#78](https://github.com/MetaMask/snap-solana-wallet/pull/78))
- feat: implement TransactionConfirmation dialog ([#80](https://github.com/MetaMask/snap-solana-wallet/pull/80))
- [SOL-43] adds the To input field ([#76](https://github.com/MetaMask/snap-solana-wallet/pull/76))
- [SOL-45] feat: implement Solana transactions ([#70](https://github.com/MetaMask/snap-solana-wallet/pull/70))
- feat: account selector ([#73](https://github.com/MetaMask/snap-solana-wallet/pull/73))
- feat: handle send action ([#72](https://github.com/MetaMask/snap-solana-wallet/pull/72))

### Fixed

- fix: sonar on main ([#82](https://github.com/MetaMask/snap-solana-wallet/pull/82))
- fix: add tests for all utils that didn't have them ([#83](https://github.com/MetaMask/snap-solana-wallet/pull/83))
- fix: cors erros using Grove for mainnet rpc provider ([#77](https://github.com/MetaMask/snap-solana-wallet/pull/77))
- fix: support get account balances on different chains ([#71](https://github.com/MetaMask/snap-solana-wallet/pull/71))

## [1.0.0]

### Added

- Get account balances ([#67](https://github.com/MetaMask/snap-solana-wallet/pull/67))
- Delete account keyring method ([#64](https://github.com/MetaMask/snap-solana-wallet/pull/64))
- Create + List Solana accounts ([#54](https://github.com/MetaMask/snap-solana-wallet/pull/54))

### Changed

- Create and remove index mismatch ([#66](https://github.com/MetaMask/snap-solana-wallet/pull/66))
- Adds the keyring-api package with solana support ([#63](https://github.com/MetaMask/snap-solana-wallet/pull/63))

## [0.1.1]

### Added

- Keyring and rpc listeners
- CI configs
- Build config
- Sonarcloud to github workflow ([#25](https://github.com/MetaMask/snap-solana-wallet/pull/25))
- Snap setup

[Unreleased]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.31.2...HEAD
[1.31.2]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.31.1...v1.31.2
[1.31.1]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.31.0...v1.31.1
[1.31.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.30.4...v1.31.0
[1.30.4]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.30.3...v1.30.4
[1.30.3]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.30.2...v1.30.3
[1.30.2]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.30.1...v1.30.2
[1.30.1]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.30.0...v1.30.1
[1.30.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.29.0...v1.30.0
[1.29.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.28.3...v1.29.0
[1.28.3]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.28.2...v1.28.3
[1.28.2]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.28.1...v1.28.2
[1.28.1]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.28.0...v1.28.1
[1.28.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.27.0...v1.28.0
[1.27.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.26.1...v1.27.0
[1.26.1]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.26.0...v1.26.1
[1.26.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.25.1...v1.26.0
[1.25.1]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.25.0...v1.25.1
[1.25.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.24.0...v1.25.0
[1.24.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.23.0...v1.24.0
[1.23.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.22.0...v1.23.0
[1.22.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.21.0...v1.22.0
[1.21.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.20.0...v1.21.0
[1.20.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.19.0...v1.20.0
[1.19.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.18.1...v1.19.0
[1.18.1]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.18.0...v1.18.1
[1.18.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.17.0...v1.18.0
[1.17.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.16.1...v1.17.0
[1.16.1]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.16.0...v1.16.1
[1.16.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.15.1...v1.16.0
[1.15.1]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.15.0...v1.15.1
[1.15.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.14.0...v1.15.0
[1.14.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.13.0...v1.14.0
[1.13.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.12.0...v1.13.0
[1.12.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.11.0...v1.12.0
[1.11.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.10.1...v1.11.0
[1.10.1]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.10.0...v1.10.1
[1.10.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.9.0...v1.10.0
[1.9.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v0.1.1...v1.0.0
[0.1.1]: https://github.com/MetaMask/snap-solana-wallet/releases/tag/v0.1.1
