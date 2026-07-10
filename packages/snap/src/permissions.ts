import { KeyringRpcMethod } from '@metamask/keyring-api';
import { KeyringSnapRpcMethod } from '@metamask/keyring-api/v2';

import { ClientRequestMethod } from './core/handlers/onClientRequest';
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
      // Keyring v2 methods
      KeyringSnapRpcMethod.GetAccounts,
      KeyringSnapRpcMethod.GetAccount,
      KeyringSnapRpcMethod.DeleteAccount,
      KeyringSnapRpcMethod.GetAccountBalances,
      KeyringSnapRpcMethod.SubmitRequest,
      KeyringSnapRpcMethod.GetAccountTransactions,
      KeyringSnapRpcMethod.GetAccountAssets,
      KeyringSnapRpcMethod.SetSelectedAccounts,
      // Keyring v1 methods kept for backwards compatibility — callers using
      // old method names are still accepted by the permission layer.
      KeyringRpcMethod.ListAccounts,
      KeyringRpcMethod.CreateAccount,
      KeyringRpcMethod.FilterAccountChains,
      KeyringRpcMethod.DiscoverAccounts,
      KeyringRpcMethod.ListAccountTransactions,
      KeyringRpcMethod.ListAccountAssets,
      // RPC methods
      RpcRequestMethod.StartSendTransactionFlow,
      RpcRequestMethod.GetFeeForTransaction,
      // Methods specific to the test dapp
      TestDappRpcRequestMethod.ListWebSockets,
      TestDappRpcRequestMethod.ListSubscriptions,
      TestDappRpcRequestMethod.TestOnStart,
      TestDappRpcRequestMethod.TestOnInstall,
      TestDappRpcRequestMethod.TestOnUpdate,
      TestDappRpcRequestMethod.SynchronizeAccounts,
      TestDappRpcRequestMethod.SetAccountSelected,
      TestDappRpcRequestMethod.ConfirmSend,
      TestDappRpcRequestMethod.SignRewardsMessage,
    ])
  : new Set([]);

const metamaskPermissions = new Set([
  // Keyring v2 methods
  KeyringSnapRpcMethod.GetAccounts,
  KeyringSnapRpcMethod.GetAccount,
  KeyringSnapRpcMethod.CreateAccounts,
  KeyringSnapRpcMethod.DeleteAccount,
  KeyringSnapRpcMethod.GetAccountBalances,
  KeyringSnapRpcMethod.SubmitRequest,
  KeyringSnapRpcMethod.GetAccountTransactions,
  KeyringSnapRpcMethod.GetAccountAssets,
  KeyringSnapRpcMethod.ResolveAccountAddress,
  KeyringSnapRpcMethod.SetSelectedAccounts,
  KeyringSnapRpcMethod.ExportAccount,
  // Keyring v1 methods kept for backwards compatibility — callers using
  // old method names are still accepted by the permission layer.
  KeyringRpcMethod.ListAccounts,
  KeyringRpcMethod.CreateAccount,
  KeyringRpcMethod.DiscoverAccounts,
  KeyringRpcMethod.ListAccountTransactions,
  KeyringRpcMethod.ListAccountAssets,
  // RPC methods
  RpcRequestMethod.StartSendTransactionFlow,
  RpcRequestMethod.GetFeeForTransaction,
  // Client methods
  ClientRequestMethod.SignAndSendTransactionWithoutConfirmation,
  ClientRequestMethod.SignProofOfOwnership,
]);

const metamask = 'metamask';

export const originPermissions = new Map<string, Set<string>>([]);

for (const origin of allowedOrigins) {
  originPermissions.set(origin, dappPermissions);
}
originPermissions.set(metamask, metamaskPermissions);
