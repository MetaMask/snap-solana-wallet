# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.11.0]

### Uncategorized

- fix: put instructions back on confirmation ([#230](https://github.com/MetaMask/snap-solana-wallet/pull/230))

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

[Unreleased]: https://github.com/MetaMask/snap-solana-wallet/compare/v1.11.0...HEAD
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
