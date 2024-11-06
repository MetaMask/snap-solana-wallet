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

  return (
    <Flex direction="column" width="full">
      <Flex align="center" justifyContent="space-between">
        <ChakraText textStyle="2xl" marginBottom="5">
          Accounts
        </ChakraText>
        <Flex>
          <Button data-test-id="refresh" colorPalette="purple" onClick={fetchAccounts} marginRight="3">
            Refresh
          </Button>
          <Button data-test-id="add-account" colorPalette="purple" onClick={handleCreateAccount}>
            Add account
          </Button>
        </Flex>
      </Flex>

      <Table.Root data-test-id="accounts-table" marginTop="4" variant="line">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Address</Table.ColumnHeader>
            <Table.ColumnHeader>Balance</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end"></Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {accounts?.map((account) => (
            <Table.Row data-test-id={account.id} key={account.id}>
              <Table.Cell data-test-id="address" fontFamily="monospace">{account.address}</Table.Cell>
              <Table.Cell data-test-id="balance">N/A</Table.Cell>
              <Table.Cell textAlign="end">
                <Button data-test-id="remove" variant="outline" colorPalette="purple">
                  Remove
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Flex>
  );
};
