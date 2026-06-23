import { KeyringRpcMethod } from '@metamask/keyring-api';
import { KeyringRpcMethod as KeyringRpcMethodV2 } from '@metamask/keyring-api/v2';

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
      // Keyring methods
      KeyringRpcMethod.ListAccounts,
      KeyringRpcMethodV2.GetAccounts,
      KeyringRpcMethodV2.GetAccount,
      KeyringRpcMethod.CreateAccount,
      KeyringRpcMethod.FilterAccountChains,
      KeyringRpcMethodV2.DeleteAccount,
      KeyringRpcMethod.DiscoverAccounts,
      KeyringRpcMethod.GetAccountBalances,
      KeyringRpcMethodV2.SubmitRequest,
      KeyringRpcMethod.ListAccountTransactions,
      KeyringRpcMethod.ListAccountAssets,
      KeyringRpcMethod.SetSelectedAccounts,
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
  // Keyring methods
  KeyringRpcMethod.ListAccounts,
  KeyringRpcMethodV2.GetAccounts,
  KeyringRpcMethodV2.GetAccount,
  KeyringRpcMethod.CreateAccount,
  KeyringRpcMethodV2.CreateAccounts,
  KeyringRpcMethodV2.DeleteAccount,
  KeyringRpcMethod.DiscoverAccounts,
  KeyringRpcMethod.GetAccountBalances,
  KeyringRpcMethodV2.SubmitRequest,
  KeyringRpcMethod.ListAccountTransactions,
  KeyringRpcMethod.ListAccountAssets,
  KeyringRpcMethod.ResolveAccountAddress,
  KeyringRpcMethod.SetSelectedAccounts,
  KeyringRpcMethodV2.ExportAccount,
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
