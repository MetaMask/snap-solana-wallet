import { Button, Link, Table } from '@chakra-ui/react';
import type { KeyringAccount, Balance } from '@metamask/keyring-api';
import { useState } from 'react';

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
          onClick={() => onRemove(account.id)}
        >
          Remove
        </Button>
      </Table.Cell>
    </Table.Row>
  );
};
