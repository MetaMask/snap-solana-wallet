import { Button, Text as ChakraText, Flex, Table } from '@chakra-ui/react';
import type { KeyringAccount } from '@metamask/keyring-api';
import { useEffect, useState } from 'react';

import { useInvokeKeyring } from '../../hooks/useInvokeKeyring';
import { AccountRow } from './AccountRow';

export const Accounts = () => {
  const [accounts, setAccounts] = useState<KeyringAccount[]>();
  const invokeKeyring = useInvokeKeyring();

  const fetchAccounts = async () => {
    const accountList = (await invokeKeyring({
      method: 'keyring_listAccounts',
    })) as KeyringAccount[];

    setAccounts(accountList);
  };

  const handleCreateAccount = async () => {
    await invokeKeyring({
      method: 'keyring_createAccount',
      params: { options: {} },
    });
    await fetchAccounts();
  };

  const handleDeleteAccount = async (id: string) => {
    await invokeKeyring({
      method: 'keyring_deleteAccount',
      params: { id },
    });
    await fetchAccounts();
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
