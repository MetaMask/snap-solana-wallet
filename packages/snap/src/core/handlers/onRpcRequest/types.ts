export enum RpcRequestMethod {
  StartSendTransactionFlow = 'startSendTransactionFlow',
  GetFeeForTransaction = 'getFeeForTransaction',
}

/**
 * Methods specific to the test dapp,
 * to allow specific flows for manual testing.
 */
export enum TestDappRpcRequestMethod {
  TestSetupAllConnections = 'testSetupAllConnections',
  TestCloseAllConnections = 'testCloseAllConnections',
  TestSubscribeToAccount = 'testSubscribeToAccount',
  TestUnsubscribeFromAccount = 'testUnsubscribeFromAccount',
}
