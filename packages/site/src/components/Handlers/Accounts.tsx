/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, Card, Flex, Heading } from '@chakra-ui/react';
import { KeyringRpcMethod, type KeyringAccount } from '@metamask/keyring-api';
import { useEffect, useState } from 'react';

import { TestDappRpcRequestMethod } from '../../../../snap/src/core/handlers/onRpcRequest/types';
import { useInvokeKeyring, useInvokeSnap } from '../../hooks';
import { toaster } from '../Toaster/Toaster';

export const Accounts = () => {
  const invokeSnap = useInvokeSnap();
  const invokeKeyring = useInvokeKeyring();
  const [accounts, setAccounts] = useState<KeyringAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<KeyringAccount[]>(
    [],
  );

  useEffect(() => {
    const fetchAndSetAccounts = async () => {
      const accountsToSet = (await invokeKeyring({
        method: KeyringRpcMethod.ListAccounts,
      }).catch((error) => {
        console.error('Error fetching accounts', error);
        return [];
      })) as KeyringAccount[];
      setAccounts(accountsToSet);
    };
    fetchAndSetAccounts();
  }, []);

  const synchronize = async () => {
    const promise = invokeSnap({
      method: TestDappRpcRequestMethod.SynchronizeAccounts,
    });

    toaster.promise(promise, {
      success: {
        title: 'Successfully synced accounts!',
        description: 'Accounts synced successfully',
      },
      error: {
        title: 'Sync failed',
        description: 'Something went wrong with the sync',
      },
      loading: { title: 'Syncing accounts...', description: 'Please wait' },
    });
  };

  const informSnapAboutSelectedAccounts = async (
    selectedAccountsToInform: KeyringAccount[],
  ) => {
    await invokeSnap({
      method: TestDappRpcRequestMethod.SetAccountSelected,
      params: {
        accountIds: selectedAccountsToInform.map((account) => account.id),
      },
    });
  };

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Accounts</Card.Title>
      </Card.Header>
      <Card.Body gap="2">
        <Flex direction="column" gap="4">
          <Button variant="outline" onClick={synchronize}>
            Synchronize
          </Button>
          <Flex direction="column" gap="2">
            <Heading as="h2" size="md">
              Selected accounts
            </Heading>
            {accounts.map((account) => (
              <Flex align="center" gap="2" key={account.id}>
                <input
                  type="checkbox"
                  checked={selectedAccounts.includes(account)}
                  onChange={(evnt) => {
                    const isChecked = evnt.target.checked;
                    let newSelectedAccounts = selectedAccounts;
                    if (isChecked) {
                      newSelectedAccounts = [...selectedAccounts, account];
                    } else {
                      newSelectedAccounts = selectedAccounts.filter(
                        (selectedAccount) => selectedAccount !== account,
                      );
                    }
                    setSelectedAccounts(
                      Array.from(new Set(newSelectedAccounts)),
                    );
                    informSnapAboutSelectedAccounts(newSelectedAccounts);
                  }}
                  id={`account-checkbox-${account.id}`}
                />
                <label htmlFor={`account-checkbox-${account.id}`}>
                  {account.id}
                </label>
              </Flex>
            ))}
          </Flex>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
};
