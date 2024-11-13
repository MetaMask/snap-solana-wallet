import { Button, Link, Table } from '@chakra-ui/react';
import {
  type KeyringAccount,
  type Balance,
  SolMethod,
} from '@metamask/keyring-api';
import { useState } from 'react';
import { CAIP2 } from '../../../../snap/src/core/constants/solana';

import { useInvokeKeyring } from '../../hooks/useInvokeKeyring';

const SOLANA_CAIP_19 = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';

export const AccountRow = ({
  account,
  onRemove,
}: {
  account: KeyringAccount;
  onRemove: (id: string) => void;
}) => {
  const invokeKeyring = useInvokeKeyring();

  const [balance, setBalance] = useState('0');

  const fetchBalance = async () => {
    const response = (await invokeKeyring({
      method: 'keyring_getAccountBalances',
      params: {
        id: account.id,
        assets: [SOLANA_CAIP_19],
      },
    })) as Record<string, Balance>;

    setBalance(response?.[SOLANA_CAIP_19]?.amount ?? '0');
  };

  const onTransfer = async (accountId: string) => {
    await invokeKeyring({
      method: 'keyring_submitRequest',
      params: {
        id: accountId, // TODO: this should be a unique request ID
        account: accountId,
        scope: CAIP2.SOLANA_DEVNET,
        request: {
          method: SolMethod.SendAndConfirmTransaction,
          params: {
            to: 'FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo',
            amount: '0.1',
          },
        },
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
          onClick={() => onTransfer(account.id)}
        >
          Transfer 0.1 SOL
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
