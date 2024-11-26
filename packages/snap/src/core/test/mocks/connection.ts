const mockGetBalanceSend = jest.fn().mockReturnValue({
  jsonrpc: '2.0',
  result: {
    context: {
      apiVersion: '1.18.22',
      slot: 302900219,
    },
    value: 1.23456789,
  },
  id: '0',
});

const mockGetBalance = jest.fn().mockReturnValue({ send: mockGetBalanceSend });

const mockGetLatestBlockhashSend = jest.fn().mockReturnValue({
  value: {
    blockhash: 'F9CSnuc5Z1FDrWTVXM4cB3SmDuFgkFB4QR4ikkrchDe3',
    lastValidBlockHeight: 1,
  },
});

const mockGetLatestBlockhash = jest.fn().mockReturnValue({
  send: mockGetLatestBlockhashSend,
});

const mockSendTransactionSend = jest.fn().mockReturnValue({
  value: {
    signature:
      '4TnmpaFDrKLcYc9sn5PKeGdQPyWsShDVJY5Hbaq1iZLBviaD1cVZuXYGQMezi8wqJBiHYupmrCfvyhxFGp92aZ19',
  },
});

const mockSendTransaction = jest.fn().mockReturnValue({
  send: mockSendTransactionSend,
});

const mockGetRpc = jest.fn().mockReturnValue({
  getBalance: mockGetBalance,
  getLatestBlockhash: mockGetLatestBlockhash,
  sendTransaction: mockSendTransaction,
});

const mockConnection = {
  getRpc: mockGetRpc,
};

export default mockConnection;
