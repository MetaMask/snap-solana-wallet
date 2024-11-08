import {
  Flex,
  Table,
  Text as ChakraText,
  Button,
  Link,
} from '@chakra-ui/react';
import type { KeyringAccount } from '@metamask/keyring-api';
import { useEffect, useState } from 'react';

import { useInvokeKeyring } from '../../hooks/useInvokeKeyring';

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
        <Button colorPalette="purple">Add account</Button>
      </Flex>
      <Table.Root variant="line">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Address</Table.ColumnHeader>
            <Table.ColumnHeader>Balance</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {accounts?.map((account) => (
            <Table.Row key={account.id}>
              <Table.Cell fontFamily="monospace">{account.address}</Table.Cell>
              <Table.Cell>N/A</Table.Cell>
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
                  onClick={async () => handleDeleteAccount(account.id)}
                >
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
