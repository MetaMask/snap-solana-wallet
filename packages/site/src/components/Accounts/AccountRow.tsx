import { Button, IconButton, Link, Table } from '@chakra-ui/react';
import {
  KeyringRpcMethod,
  SolMethod,
  type Balance,
  type KeyringAccount,
} from '@metamask/keyring-api';
import { address as asAddress } from '@solana/kit';
import { Link as RouterLink } from 'gatsby';
import { useEffect, useState } from 'react';
import { LuCopy } from 'react-icons/lu';

import { Network } from '../../../../snap/src/core/constants/solana';
import { RpcRequestMethod } from '../../../../snap/src/core/handlers/onRpcRequest/types';
import { buildUrl } from '../../../../snap/src/core/utils/buildUrl';
import { getSolanaExplorerUrl } from '../../../../snap/src/core/utils/getSolanaExplorerUrl';
import { useNetwork } from '../../context/network';
import { useInvokeKeyring, useInvokeSnap } from '../../hooks';
import { toaster } from '../Toaster/Toaster';
import { base64EncodeTransaction } from './base64EncodeTransaction';
import { buildSendSolTransactionMessage } from './buildSendSolTransactionMessage';

const SOLANA_TOKEN = 'slip44:501';

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

  const handleSend = async (id: string) => {
    await invokeSnap({
      method: RpcRequestMethod.StartSendTransactionFlow,
      params: {
        scope: network,
        account: id,
      },
    });
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

  const handleSwap = async () => {
    const lifiQuote = await getLifiQuote();

    await invokeKeyring({
      method: KeyringRpcMethod.SubmitRequest,
      params: {
        id: crypto.randomUUID(),
        scope: network,
        account: account.id,
        request: {
          method: SolMethod.SignAndSendTransaction,
          params: {
            transaction: lifiQuote.transactionRequest.data,
            scope: network,
            account: {
              address: account.address,
            },
          },
        },
      },
    });
  };

  const handleSignTransaction = async () => {
    // Build simple transaction message that sends 0.001 SOL to the same account.
    const transactionMessage = await buildSendSolTransactionMessage(
      asAddress(account.address),
      asAddress(account.address),
      1_000_000, // 0.001 SOL
      'https://solana-mainnet.infura.io/v3/5b98a22672004ef1bf40a80123c5c48d',
    );

    const transactionMessageBase64 = await base64EncodeTransaction(
      transactionMessage,
    );

    await invokeKeyring({
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
  };

  const handleSignMessage = async () => {
    const messageUtf8 =
      "This is the message you are signing. This message might contain something like what the dapp might be able to do once you sign. It also might tell the user why they need or why they should sign this message. Maybe the user will sign the message or maybe they won't. At the end of the day its their choice.";
    const messageBase64 = btoa(messageUtf8);

    await invokeKeyring({
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
  };

  const handleSignIn = async () => {
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

    await invokeKeyring({
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
  };

  useEffect(() => {
    fetchBalance();
  }, [account.id]);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    toaster.create({
      description: 'Address copied successfully',
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
      </Table.Cell>
      <Table.Cell>
        {balance} SOL{' '}
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
        <Button
          disabled={network !== Network.Mainnet}
          colorPalette="cyan"
          marginLeft="3"
          onClick={handleSwap}
        >
          Swap
        </Button>
        <Button
          colorPalette="pink"
          marginLeft="3"
          onClick={handleSignTransaction}
        >
          Sign tx
        </Button>
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
      </Table.Cell>
      <Table.Cell textAlign="end">
        <Link
          colorPalette="purple"
          href={getSolanaExplorerUrl(
            network as Network,
            'address',
            account.address,
          )}
          target="_blank"
          rel="noreferrer"
          marginRight="5"
        >
          View
        </Link>
        <Button
          variant="outline"
          colorPalette="purple"
          onClick={() => onRemove(account.id)}
        >
          Remove
        </Button>
      </Table.Cell>
    </Table.Row>
  );
};
