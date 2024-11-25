import { Button, Link, Table } from '@chakra-ui/react';
import {
  type Balance,
  type KeyringAccount,
  SolMethod,
} from '@metamask/keyring-api';
import { useState } from 'react';

import {
  SolanaCaip19Tokens,
  SolanaInternalRpcMethods,
} from '../../../../snap/src/core/constants/solana';
import { type TransactionConfirmationParams } from '../../../../snap/src/features/transaction-confirmation/components/TransactionConfirmation/types';
import { useNetwork } from '../../context/network';
import { useInvokeKeyring, useInvokeSnap } from '../../hooks';

const SOLANA_TOKEN = 'slip44:501';

export const AccountRow = ({
  account,
  onRemove,
}: {
  account: KeyringAccount;
  onRemove: (id: string) => void;
}) => {
  const invokeKeyring = useInvokeKeyring();
  const invokeSnap = useInvokeSnap();
  const { network } = useNetwork();

  const [balance, setBalance] = useState('0');

  const fetchBalance = async () => {
    const response = (await invokeKeyring({
      method: 'keyring_getAccountBalances',
      params: {
        id: account.id,
        assets: [`${network}/${SOLANA_TOKEN}`],
      },
    })) as Record<string, Balance>;

    setBalance(response?.[`${network}/${SOLANA_TOKEN}`]?.amount ?? '0');
  };

  const onTransfer = async (accountId: string) => {
    await invokeKeyring({
      method: 'keyring_submitRequest',
      params: {
        id: crypto.randomUUID(),
        account: accountId,
        scope: network,
        request: {
          method: SolMethod.SendAndConfirmTransaction,
          params: {
            to: 'FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo',
            amount: 0.1,
          },
        },
      },
    });
  };

  const onTransferWithConfirmation = async (accountId: string) => {
    await invokeSnap({
      method: SolanaInternalRpcMethods.ShowTransactionConfirmation,
      params: {
        scope: network,
        fromAccountId: accountId,
        toAddress: 'FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo',
        amount: '0.1',
        fee: '0.000005',
        tokenSymbol: 'SOL',
        tokenContractAddress: SolanaCaip19Tokens.SOL,
        tokenPrice: 0,
      } as TransactionConfirmationParams,
    });
  };

  const handleSend = async (id: string) => {
    await invokeSnap({
      method: SolanaInternalRpcMethods.StartSendTransactionFlow,
      params: {
        scope: network,
        account: id,
      },
    });
  };

  return (
    <Table.Row key={account.id}>
      <Table.Cell fontFamily="monospace">{account.address}</Table.Cell>
      <Table.Cell>
        {balance} SOL{' '}
        <Button marginLeft="3" onClick={fetchBalance}>
          Fetch
        </Button>
        <Button
          colorPalette="purple"
          marginLeft="3"
          onClick={async () => handleSend(account.id)}
        >
          Send
        </Button>
      </Table.Cell>
      <Table.Cell textAlign="end">
        <Link
          colorPalette="purple"
          href={`https://explorer.solana.com/address/${account.address}`}
          target="_blank"
          rel="noreferrer"
          marginRight="5"
        >
          View
        </Link>
        <Button
          variant="outline"
          colorPalette="purple"
          marginRight="5"
          onClick={async () => onTransfer(account.id)}
        >
          Transfer 0.1 SOL
        </Button>
        <Button
          variant="outline"
          colorPalette="purple"
          marginRight="5"
          onClick={async () => onTransferWithConfirmation(account.id)}
        >
          Transfer 0.1 SOL with Confirmation
        </Button>
        <Button
          variant="outline"
          colorPalette="purple"
          onClick={() => onRemove(account.id)}
        >
          Remove
        </Button>
      </Table.Cell>
    </Table.Row>
  );
};
