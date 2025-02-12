# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.0]

### Uncategorized

- Fix versions ([#189](https://github.com/MetaMask/snap-solana-wallet/pull/189))
- feat: bump keyring-snap-sdk version to enable the dispatcher ([#188](https://github.com/MetaMask/snap-solana-wallet/pull/188))
- fix: don't store private keys in state, derive them on the fly ([#187](https://github.com/MetaMask/snap-solana-wallet/pull/187))
- chore: remove onUpdate and onInstall handlers ([#186](https://github.com/MetaMask/snap-solana-wallet/pull/186))
- chore: pin package.json versions ([#185](https://github.com/MetaMask/snap-solana-wallet/pull/185))
- Sol 147 potential url injections in api calls ([#182](https://github.com/MetaMask/snap-solana-wallet/pull/182))
- fix: unnecessary `tsx` extension on the snap's entry point file ([#180](https://github.com/MetaMask/snap-solana-wallet/pull/180))
- Sol 135 audit lax or missing runtime input validation major ([#179](https://github.com/MetaMask/snap-solana-wallet/pull/179))
- Sol 124 audit use encrypted state as standard ([#178](https://github.com/MetaMask/snap-solana-wallet/pull/178))
- fix: adds script to dynamically change the manifest file ([#177](https://github.com/MetaMask/snap-solana-wallet/pull/177))

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

[Unreleased]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.5.0...HEAD
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
