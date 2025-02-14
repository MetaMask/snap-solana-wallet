import { Button, Text as ChakraText, Flex, Table } from '@chakra-ui/react';
import {
  KeyringRpcMethod,
  SolMethod,
  type KeyringAccount,
} from '@metamask/keyring-api';
import { useEffect, useState } from 'react';

import { Network } from '../../../../snap/src/core/constants/solana';
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
    await invokeKeyring({
      method: KeyringRpcMethod.SubmitRequest,
      params: {
        id: accounts?.[0]?.id,
        scope: Network.Mainnet,
        account: accounts?.[0]?.id,
        request: {
          method: SolMethod.SendAndConfirmTransaction,
          params: {
            base64EncodedTransactionMessage:
              'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAJDL90BPMeQxbCdwSbyC2lv/FG3wE/28MLN5GTUYRikvRDkOL72EsPrSrrKZF33sPiMFwhF786GU/O6Np6ngUZdtMjqo7S3idbRg4oDnEPLya1vPuQf89zrLobei3jVynGDSg9DdKCNU/vCuOw4ifTfNicomb7F93498t8zvvk69xVBqfVFxjHdMkoVmOYaR1etoteuKObS21cc1VbIQAAAADJQ50nw+haoQXDsfyfvHCSGDU/W09+jX/pqudxOXg8mQMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAAjJclj04kifG7PRApFI4NgwtaE5na/xCEBI572Nvp+Fm8B8VuYK09PxdzgurGVI+6H9Ms/ZDKArPnz6GF/c5zmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABHnVW/IxwG7udMVuzmgVB/2xst6j9I5RArHNola8E4+0P/on9df2SnTAmx8pWHneSwmrNt/J3VFLMhqns4zl6MrMruE4b+iaalNGVOibbNg0k2uzuaQzIcST94pSFUY5BQMCBAUJAOg3NM1RfEIABgAFAqiyAgAGAAkDooUJAAAAAAAHBgABAAgJDwEBChIPAAIBCggKCwoQAAwNDgECDxEk5RfLl3rjrSoBAAAAPQFkAAFAQg8AAAAAABCjTlMBAAAAMgAAAbg5ybz1lV0THKePgXJxVjhOuM+rVRVuJmkK/QBsDtEfAxobHAMBHRk=',
          },
        },
      },
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
