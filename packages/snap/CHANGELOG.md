# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

- `Sign{Message/Transaction/In} backend ([#241](https://github.com/MetaMask/snap-solana-wallet/pull/241))
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

[Unreleased]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.15.1...HEAD
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
