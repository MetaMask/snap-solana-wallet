import { type OnCronjobHandler } from '@metamask/snaps-sdk';

import { onTransactionAdded } from './onTransactionAdded';
import { onTransactionApproved } from './onTransactionApproved';
import { onTransactionFinalized } from './onTransactionFinalized';
import { onTransactionSubmitted } from './onTransactionSubmitted';
import { refreshAssets } from './refreshAssets';
import { refreshConfirmationEstimation } from './refreshConfirmationEstimation';
import { refreshSend } from './refreshSend';
import { refreshTransactions } from './refreshTransactions';

export enum CronjobMethod {
  RefreshSend = 'refreshSend',
  RefreshConfirmationEstimation = 'refreshConfirmationEstimation',
  RefreshTransactions = 'refreshTransactions',
  RefreshAssets = 'refreshAssets',
  /** Triggered when a transaction is shown in confirmation UI */
  OnTransactionAdded = 'onTransactionAdded',
  /** Triggered when the user confirms a transaction in the confirmation UI */
  OnTransactionApproved = 'onTransactionApproved',
  /** Triggered when a transaction is submitted to the network */
  OnTransactionSubmitted = 'onTransactionSubmitted',
  /** Triggered when a transaction is finalized (failed or confirmed) */
  OnTransactionFinalized = 'onTransactionFinalized',
}

export const handlers: Record<CronjobMethod, OnCronjobHandler> = {
  [CronjobMethod.RefreshSend]: refreshSend,
  [CronjobMethod.RefreshConfirmationEstimation]: refreshConfirmationEstimation,
  [CronjobMethod.RefreshTransactions]: refreshTransactions,
  [CronjobMethod.RefreshAssets]: refreshAssets,
  [CronjobMethod.OnTransactionAdded]: onTransactionAdded,
  [CronjobMethod.OnTransactionApproved]: onTransactionApproved,
  [CronjobMethod.OnTransactionSubmitted]: onTransactionSubmitted,
  [CronjobMethod.OnTransactionFinalized]: onTransactionFinalized,
};
