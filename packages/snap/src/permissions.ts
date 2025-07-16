import { KeyringRpcMethod } from '@metamask/keyring-api';

import { ClientRequestMethod } from './core/handlers/onClientRequest';
import { SolanaProtocolRequestMethod } from './core/handlers/onProtocolRequest/structs';
import {
  RpcRequestMethod,
  TestDappRpcRequestMethod,
} from './core/handlers/onRpcRequest/types';
import { ConfigProvider } from './core/services/config/ConfigProvider';

const prodOrigins = ['https://portfolio.metamask.io'];

const config = new ConfigProvider().get();
const isDev = ['local', 'test'].includes(config.environment);

const allowedOrigins = isDev ? ['http://localhost:3000'] : prodOrigins;

const dappPermissions = isDev
  ? new Set([
      // Keyring methods
      KeyringRpcMethod.ListAccounts,
      KeyringRpcMethod.GetAccount,
      KeyringRpcMethod.CreateAccount,
      KeyringRpcMethod.FilterAccountChains,
      KeyringRpcMethod.DeleteAccount,
      KeyringRpcMethod.DiscoverAccounts,
      KeyringRpcMethod.GetAccountBalances,
      KeyringRpcMethod.SubmitRequest,
      KeyringRpcMethod.ListAccountTransactions,
      KeyringRpcMethod.ListAccountAssets,
      // RPC methods
      RpcRequestMethod.StartSendTransactionFlow,
      RpcRequestMethod.GetFeeForTransaction,
      // Protocol methods
      SolanaProtocolRequestMethod.GetGenesisHash,
      SolanaProtocolRequestMethod.GetLatestBlockhash,
      // Client methods
      ClientRequestMethod.SignAndSendTransactionWithoutConfirmation,
      // Methods specific to the test dapp
      TestDappRpcRequestMethod.ListWebSockets,
      TestDappRpcRequestMethod.ListSubscriptions,
      TestDappRpcRequestMethod.TestOnStart,
      TestDappRpcRequestMethod.TestOnInstall,
      TestDappRpcRequestMethod.TestOnUpdate,
    ])
  : new Set([]);

const metamaskPermissions = new Set([
  // Keyring methods
  KeyringRpcMethod.ListAccounts,
  KeyringRpcMethod.GetAccount,
  KeyringRpcMethod.CreateAccount,
  KeyringRpcMethod.DeleteAccount,
  KeyringRpcMethod.DiscoverAccounts,
  KeyringRpcMethod.GetAccountBalances,
  KeyringRpcMethod.SubmitRequest,
  KeyringRpcMethod.ListAccountTransactions,
  KeyringRpcMethod.ListAccountAssets,
  KeyringRpcMethod.ResolveAccountAddress,
  // RPC methods
  RpcRequestMethod.StartSendTransactionFlow,
  RpcRequestMethod.GetFeeForTransaction,
  // Protocol methods
  SolanaProtocolRequestMethod.GetGenesisHash,
  SolanaProtocolRequestMethod.GetLatestBlockhash,
  // Client methods
  ClientRequestMethod.SignAndSendTransactionWithoutConfirmation,
]);

const metamask = 'metamask';

export const originPermissions = new Map<string, Set<string>>([]);

for (const origin of allowedOrigins) {
  originPermissions.set(origin, dappPermissions);
}
originPermissions.set(metamask, metamaskPermissions);
