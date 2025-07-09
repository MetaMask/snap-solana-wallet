# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.36.0]

### Changed

- Add buttons to test the WebSocket connections ([#450](https://github.com/MetaMask/snap-solana-wallet/pull/450))

## [1.35.0]

### Added

- Websockets setup ([#431](https://github.com/MetaMask/snap-solana-wallet/pull/431))

### Fixed

- Improvements in WSS UI ([#440](https://github.com/MetaMask/snap-solana-wallet/pull/440))

## [1.32.0]

### Added

- Add `origin` param to Keyring methods ([#395](https://github.com/MetaMask/snap-solana-wallet/pull/395))

## [1.31.0]

### Fixed

- Handle json rpc errors globally ([#386](https://github.com/MetaMask/snap-solana-wallet/pull/386))

## [1.22.0]

### Added

- Show a badge with SRP on each account row ([#306](https://github.com/MetaMask/snap-solana-wallet/pull/306))

## [1.19.0]

### Added

- Include market data when fetching spot prices ([#272](https://github.com/MetaMask/snap-solana-wallet/pull/272))

## [1.18.1]

### Changed

- Dapp site UI improvements ([#279](https://github.com/MetaMask/snap-solana-wallet/pull/279))

## [1.18.0]

### Added

- Support Multi-SRP + Implement Account Discovery ([#274](https://github.com/MetaMask/snap-solana-wallet/pull/274))

## [1.17.0]

### Added

- Add `getLatestBlockhash` protocol request ([#271](https://github.com/MetaMask/snap-solana-wallet/pull/271))

## [1.16.0]

### Added

- Bump `@metamask/keyring-api` to `^17.3.0` ([#266](https://github.com/MetaMask/snap-solana-wallet/pull/266))

## [1.15.1]

### Changed

- Move to solscan ([#264](https://github.com/MetaMask/snap-solana-wallet/pull/264))

## [1.15.0]

### Fixed

- Transaction decoding ([#262](https://github.com/MetaMask/snap-solana-wallet/pull/262))

## [1.14.0]

### Added

- Warn on bad account in confirm `signIn` ([#256](https://github.com/MetaMask/snap-solana-wallet/pull/256))
- Confirmation UI for `signTransaction` ([#251](https://github.com/MetaMask/snap-solana-wallet/pull/251))
- Confirmation UI for `signMessage` and `signIn` ([#247](https://github.com/MetaMask/snap-solana-wallet/pull/247))

### Fixed

- Fee estimate in confirm tx request ([#255](https://github.com/MetaMask/snap-solana-wallet/pull/255))

## [1.11.0]

### Fixed

- Put instructions back on confirmation ([#230](https://github.com/MetaMask/snap-solana-wallet/pull/230))

## [1.9.0]

### Added

- Support for `swap` transactions ([#214](https://github.com/MetaMask/snap-solana-wallet/pull/214))

## [1.8.0]

### Added

- Pulg send flow to `signAndSendTransaction` ([#212](https://github.com/MetaMask/snap-solana-wallet/pull/212))
- Add confirmation before submit request ([#209](https://github.com/MetaMask/snap-solana-wallet/pull/209))
- Add estimated changes to confirmation ([#210](https://github.com/MetaMask/snap-solana-wallet/pull/210))

## [1.7.0]

### Added

- Mock `wallet-standard` methods ([#204](https://github.com/MetaMask/snap-solana-wallet/pull/204))
- Add `sendAndConfirmTransaction` confirmation ([#183](https://github.com/MetaMask/snap-solana-wallet/pull/183))

## [1.4.0]

### Added

- Implement `resolveAccountAddress` ([#175](https://github.com/MetaMask/snap-solana-wallet/pull/175))
- Implement push based transactions list ([#157](https://github.com/MetaMask/snap-solana-wallet/pull/157))

### Fixed

- Conversions currency to lowercase ([#167](https://github.com/MetaMask/snap-solana-wallet/pull/167))

## [1.3.0]

### Added

- feat: update assets events ([#158](https://github.com/MetaMask/snap-solana-wallet/pull/158))
- feat: sip29 in rpc ([#153](https://github.com/MetaMask/snap-solana-wallet/pull/153))

## [1.2.0]

### Added

- Add coverage for the cronjob ([#149](https://github.com/MetaMask/snap-solana-wallet/pull/149))
- Snap send spl tokens transaction ([#130](https://github.com/MetaMask/snap-solana-wallet/pull/130))
- Add SPL token transaction parsing ([#124](https://github.com/MetaMask/snap-solana-wallet/pull/124))

## [1.1.0]

### Added

- feat!: add `scopes` field to `KeyringAccount` ([#134](https://github.com/MetaMask/snap-solana-wallet/pull/134))
- feat: list account assets ([#125](https://github.com/MetaMask/snap-solana-wallet/pull/125))

## [1.0.4]

### Added

- feat: add `keyring_listAccountTransactions` support to the snap ([#101](https://github.com/MetaMask/snap-solana-wallet/pull/101))

## [1.0.2]

### Added

- feat: connect 'Initiate Transfer' and 'Confirmation' dialogs together ([#84](https://github.com/MetaMask/snap-solana-wallet/pull/84))

## [1.0.1]

### Added

- feat: amount input ([#78](https://github.com/MetaMask/snap-solana-wallet/pull/78))
- feat: implement TransactionConfirmation dialog ([#80](https://github.com/MetaMask/snap-solana-wallet/pull/80))
- [SOL-45] feat: implement Solana transactions ([#70](https://github.com/MetaMask/snap-solana-wallet/pull/70))
- feat: account selector ([#73](https://github.com/MetaMask/snap-solana-wallet/pull/73))
- feat: handle send action ([#72](https://github.com/MetaMask/snap-solana-wallet/pull/72))

### Fixed

- fix: cors erros using Grove for mainnet rpc provider ([#77](https://github.com/MetaMask/snap-solana-wallet/pull/77))
- fix: support get account balances on different chains ([#71](https://github.com/MetaMask/snap-solana-wallet/pull/71))
- fix: changelogs ([#69](https://github.com/MetaMask/snap-solana-wallet/pull/69))

## [1.0.0]

### Added

- Get account balances ([#67](https://github.com/MetaMask/snap-solana-wallet/pull/67))
- View account on ui ([#65](https://github.com/MetaMask/snap-solana-wallet/pull/65))
- Use delete account keyring method ([#64](https://github.com/MetaMask/snap-solana-wallet/pull/64))
- Create + List Solana accounts ([#54](https://github.com/MetaMask/snap-solana-wallet/pull/54))

## [0.1.1]

### Added

- Add chakra for easier dx on site ([#53](https://github.com/MetaMask/snap-solana-wallet/pull/53))

[Unreleased]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.36.0...HEAD
[1.36.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.35.0...v1.36.0
[1.35.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.32.0...v1.35.0
[1.32.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.31.0...v1.32.0
[1.31.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.22.0...v1.31.0
[1.22.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.19.0...v1.22.0
[1.19.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.18.1...v1.19.0
[1.18.1]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.18.0...v1.18.1
[1.18.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.17.0...v1.18.0
[1.17.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.16.0...v1.17.0
[1.16.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.15.1...v1.16.0
[1.15.1]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.15.0...v1.15.1
[1.15.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.14.0...v1.15.0
[1.14.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.11.0...v1.14.0
[1.11.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.9.0...v1.11.0
[1.9.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.4.0...v1.7.0
[1.4.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.0.2...v1.0.4
[1.0.2]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/MetaMask/snap-solana-wallet/compare/v0.1.1...v1.0.0
[0.1.1]: https://github.com/MetaMask/snap-solana-wallet/releases/tag/v0.1.1
