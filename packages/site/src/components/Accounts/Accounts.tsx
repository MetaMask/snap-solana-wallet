import { Flex, Table, Text as ChakraText, Button } from '@chakra-ui/react';
import type { KeyringAccount } from '@metamask/keyring-api';
import { useEffect, useState } from 'react';

import { useInvokeKeyring } from '../../hooks/useInvokeKeyring';

export const Accounts = () => {
  const [accounts, setAccounts] = useState<KeyringAccount[]>();
  const invokeKeyring = useInvokeKeyring();

  const handleCreateAccount = async () => {
    await invokeKeyring({
      method: 'keyring_createAccount',
      params: { options: {} },
    });
  };

  const fetchAccounts = async () => {
    const accountList = (await invokeKeyring({
      method: 'keyring_listAccounts',
    })) as KeyringAccount[];

    setAccounts(accountList);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  console.log(accounts);

  return (
    <Flex direction="column" width="full">
      <Flex align="center" justifyContent="space-between">
        <ChakraText textStyle="2xl" marginBottom="5">
          Accounts
        </ChakraText>
        <Button colorPalette="purple" onClick={handleCreateAccount}>
          Add account
        </Button>
      </Flex>
      <Table.Root variant="line">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Address</Table.ColumnHeader>
            <Table.ColumnHeader>Balance</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body></Table.Body>
      </Table.Root>
    </Flex>
  );
};
