import { Button, Text as ChakraText, Flex, Table } from '@chakra-ui/react';
import {
  KeyringRpcMethod,
  SolMethod,
  type KeyringAccount,
} from '@metamask/keyring-api';
import { useEffect, useState } from 'react';

import { Network } from '../../../../snap/src/core/constants/solana';
import type { SolanaKeyringRequest } from '../../../../snap/src/core/handlers/onKeyringRequest/structs';
import { buildUrl } from '../../../../snap/src/core/utils/buildUrl';
import { useInvokeKeyring } from '../../hooks/useInvokeKeyring';
import { AccountRow } from './AccountRow';

export const Accounts = () => {
  const [accounts, setAccounts] = useState<KeyringAccount[]>();
  const invokeKeyring = useInvokeKeyring();

  const fetchAccounts = async () => {
    const accountList = (await invokeKeyring({
      method: KeyringRpcMethod.ListAccounts,
    })) as KeyringAccount[];

    setAccounts(accountList);
  };

  const handleCreateAccount = async () => {
    await invokeKeyring({
      method: KeyringRpcMethod.CreateAccount,
      params: { options: {} },
    });
    await fetchAccounts();
  };

  const handleDeleteAccount = async (id: string) => {
    await invokeKeyring({
      method: KeyringRpcMethod.DeleteAccount,
      params: { id },
    });
    await fetchAccounts();
  };

  const handleSendAndConfirmTransaction = async () => {
    const address = 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa';
    const fromToken = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const toToken = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';

    const url = buildUrl({
      baseUrl: 'https://li.quest/v1/quote',
      path: '',
      queryParams: {
        fromChain: 'SOL',
        toChain: 'SOL',
        fromToken,
        toToken,
        fromAddress: address,
        toAddress: address,
        fromAmount: '1000000',
      },
    });

    const lifiQuote = await fetch(url).then(async (quote) => quote.json());

    const request: SolanaKeyringRequest = {
      id: crypto.randomUUID(),
      scope: Network.Mainnet,
      account: accounts?.[0]?.id ?? '',
      request: {
        method: SolMethod.SignAndSendTransaction,
        params: {
          transaction: lifiQuote.transactionRequest.data,
          scope: Network.Mainnet,
          account: { address },
        },
      },
    };

    await invokeKeyring({
      method: KeyringRpcMethod.SubmitRequest,
      params: request,
    });
  };
  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <Flex direction="column" width="full">
      <Flex align="center" justifyContent="space-between">
        <ChakraText textStyle="2xl" marginBottom="5">
          Accounts
        </ChakraText>
        <Flex>
          <Button
            colorPalette="purple"
            onClick={handleSendAndConfirmTransaction}
            marginRight="3"
          >
            Send and confirm transaction
          </Button>
          <Button colorPalette="purple" onClick={fetchAccounts} marginRight="3">
            Refresh
          </Button>
          <Button colorPalette="purple" onClick={handleCreateAccount}>
            Add account
          </Button>
        </Flex>
      </Flex>
      <Table.Root marginTop="4" variant="line">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Address</Table.ColumnHeader>
            <Table.ColumnHeader>Balance</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end"></Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {accounts?.map((account) => {
            return (
              <AccountRow
                key={account.id}
                account={account}
                onRemove={handleDeleteAccount}
              />
            );
          })}
        </Table.Body>
      </Table.Root>
    </Flex>
  );
};
