import { Button, IconButton, Link, Table } from '@chakra-ui/react';
import { type Balance, type KeyringAccount } from '@metamask/keyring-api';
import { Link as RouterLink } from 'gatsby';
import { useEffect, useState } from 'react';
import { LuCopy } from 'react-icons/lu';

import { SolanaInternalRpcMethods } from '../../../../snap/src/core/constants/solana';
import { getSolanaExplorerUrl } from '../../../../snap/src/core/utils/get-solana-explorer-url';
import type { SolanaCaip2Networks } from '../../context/network';
import { useNetwork } from '../../context/network';
import { useInvokeKeyring, useInvokeSnap } from '../../hooks';
import { toaster } from '../Toaster/Toaster';

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

  const handleSend = async (id: string) => {
    await invokeSnap({
      method: SolanaInternalRpcMethods.StartSendTransactionFlow,
      params: {
        scope: network,
        account: id,
      },
    });
  };

  useEffect(() => {
    fetchBalance();
  }, [account.id]);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    toaster.create({
      description: 'Address copied successfully',
      type: 'info',
    });
  };

  return (
    <Table.Row key={account.id}>
      <Table.Cell fontFamily="monospace">
        <RouterLink to={`/${account.id}`}>{account.address}</RouterLink>
        <IconButton
          marginLeft="1"
          onClick={() => handleCopy(account.address)}
          aria-label="Copy"
          size="sm"
          variant="ghost"
          colorPalette="purple"
        >
          <LuCopy />
        </IconButton>
      </Table.Cell>
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
          href={getSolanaExplorerUrl(
            network as SolanaCaip2Networks,
            'address',
            account.address,
          )}
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
