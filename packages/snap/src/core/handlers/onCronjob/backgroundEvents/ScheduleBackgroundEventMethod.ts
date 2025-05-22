export enum ScheduleBackgroundEventMethod {
  /** Triggered when a transaction is shown in confirmation UI */
  OnTransactionAdded = 'onTransactionAdded',
  /** Triggered when the user confirms a transaction in the confirmation UI */
  OnTransactionApproved = 'onTransactionApproved',
  /** Triggered when a transaction is submitted to the network */
  OnTransactionSubmitted = 'onTransactionSubmitted',
  /** Triggered when a transaction is finalized (failed or confirmed) */
  OnTransactionFinalized = 'onTransactionFinalized',
  /** Triggered when a transaction is rejected */
  OnTransactionRejected = 'onTransactionRejected',
  /** Triggered when a transaction is signed */
  OnSignTransaction = 'onSignTransaction',
  /** Triggered when the user's accounts are refreshed */
  OnAccountsRefreshed = 'onAccountsRefreshed',
}
