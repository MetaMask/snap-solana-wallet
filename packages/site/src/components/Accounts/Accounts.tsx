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
              'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAKEb90BPMeQxbCdwSbyC2lv/FG3wE/28MLN5GTUYRikvRDkOL72EsPrSrrKZF33sPiMFwhF786GU/O6Np6ngUZdtMjqo7S3idbRg4oDnEPLya1vPuQf89zrLobei3jVynGDT23WlYbqpa0+YWZyJHXFuu3ghb5vWc1zPY3lpthsJywNxBrinkyKcWM0yri8Ob6fbj2ETlWbB74B2SrzsZMN6A4AciRc/6MiXjQIWCX5+3q02bOsSR457gFdL/3Lh+okGdBBA/kB6qwUEagfnGzH2GY12XE3va/gn3W4Loqy/D+KD0N0oI1T+8K47DiJ9N82JyiZvsX3fj3y3zO++Tr3FUGp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAF4nHfb+JwqvkradTprCUYGxgeCmdW23N0dNFlh3oAUoAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAACMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABHnVW/IxwG7udMVuzmgVB/2xst6j9I5RArHNola8E49RPixdukLDvYMw2r2DTumX5VA1ifoAVfXgkOTnLswDEsb6evO+2606PWXzaqvJdDGxu+TC0vbg5HymAgNFL11htD/6J/XX9kp0wJsfKVh53ksJqzbfyd1RSzIap7OM5egLL/w6XaW4bMACKgDkMCO/P216VA/gUkRXFdMdFNW5YAUHAggJCQDjIkUV3+beAAoABQL0JgYACgAJA/ymAwAAAAAACwYAAQArDCABAQ03IA4AAgMEAQ8rDQ0QDSEOAwUREhMUIiMkJSAmDgUGFRYXGCcoKSUgKiAgLA4ZLSsGGgQbHB0eHy7BIJszQdacgQMDAAAAOGQAATlkAQIvAQBkAgNAQg8AAAAAADebflQBAAAAMgAAAll9OSuqqDQaRb6IYUBogcRuGRFfhgIEuha8cjU4fZPaCE6mCqEIBQYACwQRFAwNBwIJAQNYRSgzxt9mjqPDnIv4wQLLax/KAPQld+nhmgCbR8LsRmwHCgwBCAUDBwMCCQA=',
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
