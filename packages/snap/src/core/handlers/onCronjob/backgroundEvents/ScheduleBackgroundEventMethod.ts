export enum ScheduleBackgroundEventMethod {
  /** Triggered when a transaction is shown in confirmation UI */
  OnTransactionAdded = 'onTransactionAdded',
  /** Triggered when the user confirms a transaction in the confirmation UI */
  OnTransactionApproved = 'onTransactionApproved',
  /** Triggered when a transaction is rejected */
  OnTransactionRejected = 'onTransactionRejected',
  /** Use it to schedule a background event to asynchronously fetch the transactions of an account */
  OnSyncAccountTransactions = 'onSyncAccountTransactions',
  /** Use it to schedule a background event to refresh the send form */
  RefreshSend = 'refreshSend',
  /** Use it to schedule a background event to refresh the confirmation estimation */
  RefreshConfirmationEstimation = 'refreshConfirmationEstimation',
}
