/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import {
  Button,
  Text as ChakraText,
  Code,
  Flex,
  Heading,
  Link,
  Table,
} from '@chakra-ui/react';
import type {
  Balance,
  KeyringAccount,
  Transaction,
} from '@metamask/keyring-api';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { Network } from '../../../../snap/src/core/constants/solana';
import {
  Networks,
  SolanaInternalRpcMethods,
} from '../../../../snap/src/core/constants/solana';
import { getNetworkFromToken } from '../../../../snap/src/core/utils/getNetworkFromToken';
import { getSolanaExplorerUrl } from '../../../../snap/src/core/utils/getSolanaExplorerUrl';
import { useNetwork } from '../../context/network';
import { useInvokeSnap } from '../../hooks';
import { useInvokeKeyring } from '../../hooks/useInvokeKeyring';
import { formatLongString } from '../../utils/format-long-string';

type ListAccountTransactionsResponse = {
  data: Transaction[];
  next: string | null;
};

type PaginationState = {
  limit: number;
  next?: string | null;
};

export const AccountDetails = ({ accountId }: { accountId: string }) => {
  const { network } = useNetwork();
  const [selectedAccount, setSelectedAccount] = useState<KeyringAccount>();
  const [selectedAccountBalances, setSelectedAccountBalances] = useState<
    Record<string, Balance>
  >({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    limit: 10,
    next: null,
  });
  const [isFetchingTransactions, setIsFetchingTransactions] = useState(false);
  const initialFetchRef = useRef(false);

  const invokeKeyring = useInvokeKeyring();
  const invokeSnap = useInvokeSnap();

  const fetchAccount = async (id: string) => {
    const account = (await invokeKeyring({
      method: 'keyring_getAccount',
      params: { id },
    })) as KeyringAccount;

    setSelectedAccount(account);
  };

  const fetchAccountBalances = async (id: string) => {
    const assets = await invokeSnap({
      method: SolanaInternalRpcMethods.ListAccountAssets,
      params: {
        id,
      },
    });

    const balances = (await invokeKeyring({
      method: 'keyring_getAccountBalances',
      params: { id, assets },
    })) as Record<string, Balance>;

    setSelectedAccountBalances(balances);
  };

  const fetchAccountTransactions = async (id: string) => {
    setIsFetchingTransactions(true);
    if (initialFetchRef.current && !pagination.next) {
      return;
    }
    initialFetchRef.current = true;

    const response = (await invokeKeyring({
      method: 'keyring_listAccountTransactions',
      params: {
        id,
        pagination: {
          limit: pagination.limit,
          next: pagination.next,
        },
      },
    })) as ListAccountTransactionsResponse;

    if (!response?.data) {
      return;
    }

    setTransactions((prevTransactions) => [
      ...prevTransactions,
      ...response.data,
    ]);
    setPagination((prev) => ({
      ...prev,
      next: response.next,
    }));
    setIsFetchingTransactions(false);
  };

  useEffect(() => {
    fetchAccount(accountId);
    fetchAccountTransactions(accountId);
    fetchAccountBalances(accountId);
  }, []);

  const accountBalances: Record<string, Balance> = useMemo(() => {
    return Object.keys(selectedAccountBalances ?? {}).reduce(
      (list, assetId) => {
        const assetNetwork = getNetworkFromToken(assetId);
        const asset = selectedAccountBalances[assetId];

        if (assetNetwork !== network) {
          return list;
        }

        return {
          ...list,
          [assetId]: asset,
        };
      },
      {},
    );
  }, [network, selectedAccountBalances]);

  if (!selectedAccount) {
    return (
      <Flex direction="column" width="full">
        <ChakraText textStyle="2xl">Account not found</ChakraText>
      </Flex>
    );
  }

  return (
    <Flex direction="column" width="full">
      <Heading size="4xl" marginBottom="2">
        Account Details
      </Heading>
      <Flex marginBottom="2">
        <ChakraText marginRight="2">Keyring Account ID:</ChakraText>
        <Code>{selectedAccount.id}</Code>
      </Flex>
      <Link
        colorPalette="purple"
        href={getSolanaExplorerUrl(
          network as Network,
          'address',
          selectedAccount.address,
        )}
        target="_blank"
        rel="noreferrer"
        width="fit-content"
        marginBottom="2"
      >
        {selectedAccount.address}
      </Link>
      <Heading size="2xl" marginBottom="5">
        Balances
      </Heading>
      <Table.Root marginBottom="5">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Network</Table.ColumnHeader>
            <Table.ColumnHeader>Symbol</Table.ColumnHeader>
            <Table.ColumnHeader>Amount</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Object.keys(accountBalances).map((balanceId) => (
            <Table.Row key={balanceId}>
              <Table.Cell>
                {Networks[balanceId.split('/')[0] as Network].name}
              </Table.Cell>
              <Table.Cell>
                {accountBalances[balanceId]?.unit || 'Unknown'}
              </Table.Cell>
              <Table.Cell>
                {accountBalances[balanceId]?.amount ?? '-'}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Heading size="2xl" marginBottom="5">
        Transactions
      </Heading>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Network</Table.ColumnHeader>
            <Table.ColumnHeader>Timestamp</Table.ColumnHeader>
            <Table.ColumnHeader>Type</Table.ColumnHeader>
            <Table.ColumnHeader>Signature</Table.ColumnHeader>
            <Table.ColumnHeader>From</Table.ColumnHeader>
            <Table.ColumnHeader>To</Table.ColumnHeader>
            <Table.ColumnHeader>Fee</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {transactions.map((tx) => (
            <Table.Row key={tx.id}>
              <Table.Cell>{Networks[tx.chain as Network].cluster}</Table.Cell>
              <Table.Cell>
                {tx.timestamp
                  ? new Date(tx.timestamp * 1000).toUTCString()
                  : '-'}
              </Table.Cell>
              <Table.Cell>{tx.type}</Table.Cell>
              <Table.Cell>
                <Link
                  colorPalette="purple"
                  href={getSolanaExplorerUrl(tx.chain as Network, 'tx', tx.id)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {formatLongString(tx.id)}
                </Link>
              </Table.Cell>
              <Table.Cell>
                {tx.from?.map((fromItem, idx) => (
                  <Flex
                    key={`${tx.id}-from-${idx}`}
                    direction="column"
                    mb={idx === tx.from.length - 1 ? 0 : 2}
                  >
                    <ChakraText fontSize="sm">
                      {formatLongString(fromItem.address ?? '')}
                    </ChakraText>
                    <ChakraText fontSize="xs" color="gray.400">
                      Sent{' '}
                      {fromItem?.asset?.fungible
                        ? fromItem.asset.amount
                        : 'N/A'}{' '}
                      {fromItem?.asset?.fungible ? fromItem.asset.unit : ''}
                    </ChakraText>
                  </Flex>
                ))}
              </Table.Cell>
              <Table.Cell>
                {tx.to?.map((toItem, idx) => (
                  <Flex
                    key={`${tx.id}-to-${idx}`}
                    direction="column"
                    mb={idx === tx.to.length - 1 ? 0 : 2}
                  >
                    <ChakraText fontSize="sm">
                      {formatLongString(toItem.address ?? '')}
                    </ChakraText>
                    <ChakraText fontSize="xs" color="gray.400">
                      Received{' '}
                      {toItem?.asset?.fungible ? toItem.asset.amount : 'N/A'}{' '}
                      {toItem?.asset?.fungible ? toItem.asset.unit : ''}
                    </ChakraText>
                  </Flex>
                ))}
              </Table.Cell>
              <Table.Cell>
                {tx.fees?.map((feeItem, idx) => (
                  <ChakraText
                    key={`${tx.id}-fee-${idx}`}
                    fontSize="m"
                    color="gray.200"
                  >
                    {feeItem.asset.fungible ? feeItem.asset.amount : 'N/A'}{' '}
                    {feeItem.asset?.fungible ? feeItem.asset.unit : ''}
                  </ChakraText>
                ))}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <Button
        disabled={isFetchingTransactions || !pagination.next}
        onClick={async () => fetchAccountTransactions(accountId)}
        mt={4}
        size="sm"
      >
        Load More
      </Button>
    </Flex>
  );
};
