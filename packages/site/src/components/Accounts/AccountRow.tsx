import {
  Button,
  IconButton,
  Link,
  Menu,
  Portal,
  Table,
} from '@chakra-ui/react';
import {
  KeyringRpcMethod,
  SolMethod,
  type Balance,
  type KeyringAccount,
} from '@metamask/keyring-api';
import { address as asAddress } from '@solana/kit';
import { Link as RouterLink } from 'gatsby';
import { useEffect, useState } from 'react';
import { LuCopy, LuExternalLink, LuTrash } from 'react-icons/lu';

import { Network } from '../../../../snap/src/core/constants/solana';
import { RpcRequestMethod } from '../../../../snap/src/core/handlers/onRpcRequest/types';
import { buildUrl } from '../../../../snap/src/core/utils/buildUrl';
import { getSolanaExplorerUrl } from '../../../../snap/src/core/utils/getSolanaExplorerUrl';
import { useNetwork } from '../../context/network';
import { useInvokeKeyring, useInvokeSnap } from '../../hooks';
import { toaster } from '../Toaster/Toaster';
import { buildNoOpWithHelloWorldData } from './builders/buildNoOpWithHelloWorldData';
import { buildSendSolTransactionMessage } from './builders/buildSendSolTransactionMessage';

const SOLANA_TOKEN = 'slip44:501';

type InvokeResponse = {
  result: object | null;
};

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
      method: KeyringRpcMethod.GetAccountBalances,
      params: {
        id: account.id,
        assets: [`${network}/${SOLANA_TOKEN}`],
      },
    })) as Record<string, Balance>;

    setBalance(response?.[`${network}/${SOLANA_TOKEN}`]?.amount ?? '0');
  };

  const handleInvokeResponse = (
    response: InvokeResponse,
    description: React.ReactNode,
    action?: { label: string; onClick: () => void },
  ) => {
    if (response.result === null) {
      toaster.create({
        description: 'Rejected the confirmation',
        type: 'info',
      });
    } else {
      toaster.create({
        description,
        type: 'success',
        action: action as any,
      });
    }
  };

  const handleInvokeError = (error: any) => {
    toaster.create({
      description: error.message,
      type: 'error',
    });
  };

  const handleSend = async (id: string) => {
    try {
      await invokeSnap({
        method: RpcRequestMethod.StartSendTransactionFlow,
        params: {
          scope: network,
          account: id,
        },
      });
    } catch (error) {
      handleInvokeError(error);
    }
  };

  const getLifiQuote = async () => {
    const url = buildUrl({
      baseUrl: 'https://li.quest',
      path: '/v1/quote',
      queryParams: {
        fromChain: 'SOL',
        toChain: 'SOL',
        fromToken: 'So11111111111111111111111111111111111111112',
        toToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        fromAddress: account.address,
        toAddress: account.address,
        fromAmount: '10000',
      },
    });

    const lifiQuote = await fetch(url).then(async (quote) => quote.json());

    return lifiQuote;
  };

  /**
   * A list of use cases for transactions that can be signed.
   * We display a menu item for each.
   *
   * Each item has a title, shown in UI, and a builder function.
   * The builder function returns a promise that resolves to the transaction or transaction message in base64 encoding.
   */
  const USE_CASES = [
    {
      title: 'No-op with "Hello, world!" data | SDK v1',
      excludeFromNetworks: [],
      builder: async () =>
        buildNoOpWithHelloWorldData(
          asAddress(account.address),
          network as Network,
        ),
    },
    {
      title: 'Send 0.001 SOL to self | SDK v2',
      excludeFromNetworks: [],
      builder: async () =>
        buildSendSolTransactionMessage(
          asAddress(account.address),
          asAddress(account.address),
          1_000_000, // 0.001 SOL
          network as Network,
        ),
    },
    {
      title: 'Swap 0.001 SOL to USDC on LiFi | SDK v2',
      excludeFromNetworks: [Network.Devnet, Network.Testnet, Network.Localnet],
      builder: async () => {
        const lifiQuote = await getLifiQuote();
        return lifiQuote.transactionRequest.data;
      },
    },
  ];

  const handleSignAndSendTransaction = async (
    builder: () => Promise<string>,
  ) => {
    try {
      const transactionMessageBase64 = await builder();

      const response = await invokeKeyring({
        method: KeyringRpcMethod.SubmitRequest,
        params: {
          id: crypto.randomUUID(),
          scope: network,
          account: account.id,
          request: {
            method: SolMethod.SignAndSendTransaction,
            params: {
              transaction: transactionMessageBase64,
              scope: network,
              account: {
                address: account.address,
              },
            },
          },
        },
      });

      handleInvokeResponse(
        response as InvokeResponse,
        'Transaction signed and sent successfully',
        {
          label: 'View',
          onClick: () => {
            window.open(
              getSolanaExplorerUrl(
                network as Network,
                'tx',
                (response as any).result.signature,
              ),
              '_blank',
            );
          },
        },
      );
    } catch (error) {
      handleInvokeError(error);
    }
  };

  const handleSignTransaction = async (builder: () => Promise<string>) => {
    try {
      const transactionMessageBase64 = await builder();

      const response = await invokeKeyring({
        method: KeyringRpcMethod.SubmitRequest,
        params: {
          id: crypto.randomUUID(),
          scope: network,
          account: account.id,
          request: {
            method: SolMethod.SignTransaction,
            params: {
              account: {
                address: account.address,
              },
              transaction: transactionMessageBase64,
              scope: network,
              options: {
                commitment: 'finalized',
              },
            },
          },
        },
      });

      handleInvokeResponse(
        response as InvokeResponse,
        'Transaction signed successfully',
      );
    } catch (error) {
      handleInvokeError(error);
    }
  };

  const handleSignMessage = async () => {
    try {
      const messageUtf8 =
        "This is the message you are signing. This message might contain something like what the dapp might be able to do once you sign. It also might tell the user why they need or why they should sign this message. Maybe the user will sign the message or maybe they won't. At the end of the day its their choice.";
      const messageBase64 = btoa(messageUtf8);

      const response = await invokeKeyring({
        method: KeyringRpcMethod.SubmitRequest,
        params: {
          id: crypto.randomUUID(),
          scope: network,
          account: account.id,
          request: {
            method: SolMethod.SignMessage,
            params: {
              message: messageBase64,
              account: {
                address: account.address,
              },
            },
          },
        },
      });

      handleInvokeResponse(
        response as InvokeResponse,
        'Message signed successfully',
      );
    } catch (error) {
      handleInvokeError(error);
    }
  };

  const handleSignIn = async () => {
    try {
      const requestId = crypto.randomUUID();
      const params = {
        domain: 'example.com',
        address: 'Sol11111111111111111111111111111111111111112',
        statement: 'I accept the terms of service',
        uri: 'https://example.com/login',
        version: '1',
        chainId: 'solana:101',
        nonce: '32891756',
        issuedAt: '2024-01-01T00:00:00.000Z',
        expirationTime: '2024-01-02T00:00:00.000Z',
        notBefore: '2023-12-31T00:00:00.000Z',
        requestId,
        resources: [
          'ipfs://bafybeiemxf5abjwjbikoz4mc3a3dla6ual3jsgpdr4cjr3oz3evfyavhwq/',
          'https://example.com/my-web2-claim.json',
        ],
      };

      const response = await invokeKeyring({
        method: KeyringRpcMethod.SubmitRequest,
        params: {
          id: requestId,
          scope: network,
          account: account.id,
          request: {
            method: SolMethod.SignIn,
            params,
          },
        },
      });

      handleInvokeResponse(
        response as InvokeResponse,
        'Signed in successfully',
      );
    } catch (error) {
      handleInvokeError(error);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [account.id]);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    toaster.create({
      description: 'Address copied',
      type: 'info',
    });
  };

  return (
    <Table.Row key={account.id}>
      <Table.Cell fontFamily="monospace">
        <RouterLink to={`/${account.id}`}>
          {account.address.slice(0, 6)}...{account.address.slice(-4)}
        </RouterLink>
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
        <Link
          colorPalette="purple"
          href={getSolanaExplorerUrl(
            network as Network,
            'address',
            account.address,
          )}
          target="_blank"
          rel="noreferrer"
          marginLeft="3"
        >
          <LuExternalLink />
        </Link>
      </Table.Cell>
      <Table.Cell>{balance} SOL </Table.Cell>
      <Table.Cell textAlign="end">
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
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button marginLeft="3" colorPalette="cyan">
              Sign & Send Tx
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                {USE_CASES.filter(
                  (signableTransaction) =>
                    !signableTransaction.excludeFromNetworks.includes(
                      network as Network,
                    ),
                ).map((signableTransaction) => (
                  <Menu.Item
                    key={signableTransaction.title}
                    value={signableTransaction.title}
                    onClick={async () =>
                      handleSignAndSendTransaction(signableTransaction.builder)
                    }
                  >
                    {signableTransaction.title}
                  </Menu.Item>
                ))}
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button marginLeft="3" colorPalette="pink">
              Sign Tx
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                {USE_CASES.filter(
                  (signableTransaction) =>
                    !signableTransaction.excludeFromNetworks.includes(
                      network as Network,
                    ),
                ).map((signableTransaction) => (
                  <Menu.Item
                    key={signableTransaction.title}
                    value={signableTransaction.title}
                    onClick={async () =>
                      handleSignTransaction(signableTransaction.builder)
                    }
                  >
                    {signableTransaction.title}
                  </Menu.Item>
                ))}
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
        <Button
          colorPalette="orange"
          marginLeft="3"
          onClick={handleSignMessage}
        >
          Sign msg
        </Button>
        <Button colorPalette="green" marginLeft="3" onClick={handleSignIn}>
          Sign In
        </Button>
        <Button
          variant="ghost"
          colorPalette="purple"
          marginLeft="3"
          size="xs"
          onClick={() => onRemove(account.id)}
        >
          <LuTrash />
        </Button>
      </Table.Cell>
    </Table.Row>
  );
};
