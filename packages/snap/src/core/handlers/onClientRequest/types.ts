export enum ClientRequestMethod {
  SignAndSendTransactionWithoutConfirmation = 'signAndSendTransactionWithoutConfirmation',
  ConfirmSend = 'confirmSend',
  SignAndSendTransaction = 'signAndSendTransaction',
  ComputeFee = 'computeFee',
  OnAddressInput = 'onAddressInput',
  OnAmountInput = 'onAmountInput',
}
