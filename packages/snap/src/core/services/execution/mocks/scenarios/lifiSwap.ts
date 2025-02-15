/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  address,
  blockhash,
  type CompilableTransactionMessage,
} from '@solana/web3.js';

import { Network } from '../../../../constants/solana';
import {
  MOCK_SOLANA_KEYRING_ACCOUNT_1,
  MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES,
} from '../../../../test/mocks/solana-keyring-accounts';
import type { MockExecutionScenario } from './types';

const scope = Network.Mainnet;

// Same from and to account
const account = MOCK_SOLANA_KEYRING_ACCOUNT_1;

const fromAccountPrivateKeyBytes =
  MOCK_SOLANA_KEYRING_ACCOUNTS_PRIVATE_KEY_BYTES[account.id]!;

const transactionMessage: CompilableTransactionMessage = {
  version: 0,
  feePayer: {
    address: address('FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo'),
  },
  lifetimeConstraint: {
    blockhash: blockhash('F3mgS4DGisBt8Uc2MfM5r4ow2RcPFJrp333h7YSgTin6'),
    lastValidBlockHeight: 18446744073709551615n,
  },
  instructions: [
    {
      programAddress: address('3i5JeuZuUxeKtVysUnwQNGerJP2bSMX9fTFfS4Nxe3Br'),
      accounts: [
        {
          address: address('SysvarC1ock11111111111111111111111111111111'),
          role: 0,
        },
        {
          address: address('EYekEEy28BaAKDspYxEcTRjgJkrgTv8GdbZ7GsdaYYye'),
          role: 0,
        },
      ],
      data: Uint8Array.from([0, 139, 203, 23, 160, 77, 48, 130, 0]),
    },
    {
      programAddress: address('ComputeBudget111111111111111111111111111111'),
      data: Uint8Array.from([2, 184, 129, 22, 0]),
    },
    {
      programAddress: address('ComputeBudget111111111111111111111111111111'),
      data: Uint8Array.from([3, 32, 161, 7, 0, 0, 0, 0]),
    },
    {
      programAddress: address('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
      accounts: [
        {
          address: address('FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo'),
          role: 3,
        },
        {
          address: address('9gY6g14A8N2Jvdy4dwoZmXvPNhPPAn58GQxYhu6cSRAy'),
          role: 1,
        },
        {
          address: address('FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo'),
          role: 3,
        },
        {
          address: address('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'),
          role: 0,
        },
        {
          address: address('11111111111111111111111111111111'),
          role: 0,
        },
        {
          address: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          addressIndex: 7,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
      ],
      data: Uint8Array.from([1]),
    },
    {
      programAddress: address('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
      accounts: [
        {
          address: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          addressIndex: 7,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('6U91aKa8pmMxkJwBCfPTmUEfZi6dHe7DcFq2ALvB2tbB'),
          role: 0,
        },
        {
          address: address('FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo'),
          role: 3,
        },
        {
          address: address('5kBNWdETUczauBADqGQNUcAAhrCntL2TMUtpfysmyy5p'),
          role: 1,
        },
        {
          address: address('59v2cSbCsnyaWymLnsq6TWzE6cEN5KJYNTBNrcP4smRH'),
          role: 1,
        },
        {
          address: address('4hwwqG3yPawkEzFyGMvHqM8rnjDPEhZRG8gggmAviKUb'),
          role: 1,
        },
        {
          address: address('9gY6g14A8N2Jvdy4dwoZmXvPNhPPAn58GQxYhu6cSRAy'),
          role: 1,
        },
        {
          address: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
          addressIndex: 11,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'),
          role: 0,
        },
        {
          address: address('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
          role: 0,
        },
        {
          address: address('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
          role: 0,
        },
        {
          address: address('D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf'),
          role: 0,
        },
        {
          address: address('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
          role: 0,
        },
        {
          address: address('LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'),
          addressIndex: 6,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('DbTk2SNKWxu9TJbPzmK9HcQCAmraBCFb5VMo8Svwh34z'),
          addressIndex: 4,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 1,
        },
        {
          address: address('LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'),
          addressIndex: 6,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('2LNvcmeTwEtWhtbFiNWcQ5SAVa23np1syTrgjYeayE83'),
          addressIndex: 9,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 1,
        },
        {
          address: address('9n5JZGhE31tWh2guMgke5Xhx178oMUexCjkA56E9RL15'),
          addressIndex: 2,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 1,
        },
        {
          address: address('59v2cSbCsnyaWymLnsq6TWzE6cEN5KJYNTBNrcP4smRH'),
          role: 1,
        },
        {
          address: address('DPNFSk4kUZ7p2k2MdrQLrhDzdULCRSSj44M8e3c5n9oH'),
          role: 1,
        },
        {
          address: address('27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4'),
          addressIndex: 10,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
          addressIndex: 11,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('AauSbyE34GsfndXiYuURRcFFMZFLxuwqCKwriwicvonP'),
          addressIndex: 15,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 1,
        },
        {
          address: address('LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'),
          addressIndex: 6,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('6U91aKa8pmMxkJwBCfPTmUEfZi6dHe7DcFq2ALvB2tbB'),
          role: 0,
        },
        {
          address: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          addressIndex: 7,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          addressIndex: 7,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('D1ZN9Wj1fRSUQfCjhvnu1hqDMT7hzjzBBpi12nVniYD6'),
          addressIndex: 12,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'),
          addressIndex: 6,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('FWdGExzsHnoKeo6KNR9aYnvARwNaSUjMgwNusE3zDTYL'),
          role: 1,
        },
        {
          address: address('3GbT545yUsVpzKMc2ZnnK2pSMcB8A4YtPTamMj5qtSjc'),
          role: 1,
        },
        {
          address: address('2kN79B8PGMo6nP7fi31XT9iEj9dvZqp5eKZpX731Wke6'),
          role: 1,
        },
        {
          address: address('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
          role: 0,
        },
        {
          address: address('LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'),
          addressIndex: 6,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('HQtgECMQPQj73jQCuCapqRMMQAHAJwB1MKCvS4iro4i2'),
          addressIndex: 90,
          lookupTableAddress: address(
            'DFiF5MtKEDSzGh81zbip3P4zw3Y6JAubUbFdZqAogqyw',
          ),
          role: 1,
        },
        {
          address: address('LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'),
          addressIndex: 6,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('92znhuo5mSBriZaiSfGNdiFoivLTxhgnZKUy8FMr9f6i'),
          addressIndex: 19,
          lookupTableAddress: address(
            'DFiF5MtKEDSzGh81zbip3P4zw3Y6JAubUbFdZqAogqyw',
          ),
          role: 1,
        },
        {
          address: address('Bg9mdAYRpwkCYriVfhPdtzwB544f4HKvX2z6of6qccQP'),
          addressIndex: 18,
          lookupTableAddress: address(
            'DFiF5MtKEDSzGh81zbip3P4zw3Y6JAubUbFdZqAogqyw',
          ),
          role: 1,
        },
        {
          address: address('DPNFSk4kUZ7p2k2MdrQLrhDzdULCRSSj44M8e3c5n9oH'),
          role: 1,
        },
        {
          address: address('7x4VcEX8aLd3kFsNWULTp1qFgVtDwyWSxpTGQkoMM6XX'),
          role: 1,
        },
        {
          address: address('27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4'),
          addressIndex: 10,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('So11111111111111111111111111111111111111112'),
          addressIndex: 16,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('CDwLouXTtamtG4qgnmM8v9rXhgGaeBoHmBSZv5FVwPTV'),
          addressIndex: 16,
          lookupTableAddress: address(
            'DFiF5MtKEDSzGh81zbip3P4zw3Y6JAubUbFdZqAogqyw',
          ),
          role: 1,
        },
        {
          address: address('LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'),
          addressIndex: 6,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('6U91aKa8pmMxkJwBCfPTmUEfZi6dHe7DcFq2ALvB2tbB'),
          role: 0,
        },
        {
          address: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          addressIndex: 7,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          addressIndex: 7,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('D1ZN9Wj1fRSUQfCjhvnu1hqDMT7hzjzBBpi12nVniYD6'),
          addressIndex: 12,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'),
          addressIndex: 6,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('Dw943QuxxvB2Se5etoSY3EShb8va8U7zRXHF52DLQcNA'),
          addressIndex: 17,
          lookupTableAddress: address(
            'DFiF5MtKEDSzGh81zbip3P4zw3Y6JAubUbFdZqAogqyw',
          ),
          role: 1,
        },
        {
          address: address('FvZgh2aSjZHFsREiqiwp1SSkjEj4soem73LxqKzSredy'),
          addressIndex: 20,
          lookupTableAddress: address(
            'DFiF5MtKEDSzGh81zbip3P4zw3Y6JAubUbFdZqAogqyw',
          ),
          role: 1,
        },
        {
          address: address('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
          role: 0,
        },
        {
          address: address('CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK'),
          addressIndex: 34,
          lookupTableAddress: address(
            '6HSd2giA4GPy4Mr2SwGN2yURKTWLB8Wveu5E8L73QBp1',
          ),
          role: 0,
        },
        {
          address: address('6U91aKa8pmMxkJwBCfPTmUEfZi6dHe7DcFq2ALvB2tbB'),
          role: 0,
        },
        {
          address: address('3h2e43PunVA5K34vwKCLHWhZF4aZpyaC9RmxvshGAQpL'),
          addressIndex: 33,
          lookupTableAddress: address(
            '6HSd2giA4GPy4Mr2SwGN2yURKTWLB8Wveu5E8L73QBp1',
          ),
          role: 0,
        },
        {
          address: address('ysq96dVZrrMVRassYB2Vr5cHFWoSQDRzQRGNmRRtr1L'),
          addressIndex: 35,
          lookupTableAddress: address(
            '6HSd2giA4GPy4Mr2SwGN2yURKTWLB8Wveu5E8L73QBp1',
          ),
          role: 1,
        },
        {
          address: address('7x4VcEX8aLd3kFsNWULTp1qFgVtDwyWSxpTGQkoMM6XX'),
          role: 1,
        },
        {
          address: address('4hwwqG3yPawkEzFyGMvHqM8rnjDPEhZRG8gggmAviKUb'),
          role: 1,
        },
        {
          address: address('7B9icCwrEAwJhvpYtPixagtxM3AVXDwWrZkQiE7YiGpX'),
          addressIndex: 36,
          lookupTableAddress: address(
            '6HSd2giA4GPy4Mr2SwGN2yURKTWLB8Wveu5E8L73QBp1',
          ),
          role: 1,
        },
        {
          address: address('B7b8YgV8rJXdeuMyfP5mhZL3SU46si9owrKT5a8Ss8Nr'),
          addressIndex: 30,
          lookupTableAddress: address(
            '6HSd2giA4GPy4Mr2SwGN2yURKTWLB8Wveu5E8L73QBp1',
          ),
          role: 1,
        },
        {
          address: address('Gajn4cvFPSFNFCUrvLbTwjkgShvTTS4TGPxYqc1HcG6a'),
          addressIndex: 29,
          lookupTableAddress: address(
            '6HSd2giA4GPy4Mr2SwGN2yURKTWLB8Wveu5E8L73QBp1',
          ),
          role: 1,
        },
        {
          address: address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          addressIndex: 7,
          lookupTableAddress: address(
            'FucMYjkfiJo4G9fbhQuc4cwpXnyhQRLRNwJzBmxRHryr',
          ),
          role: 0,
        },
        {
          address: address('ASoXooAr9FdVvNwRmRJtMcBqVszJh6eD8JQ68kZXoUom'),
          role: 1,
        },
        {
          address: address('8N6UVVK4hk42EwxCosZ96w8GMSDiSTC5AdNxbc7oFH5g'),
          addressIndex: 32,
          lookupTableAddress: address(
            '6HSd2giA4GPy4Mr2SwGN2yURKTWLB8Wveu5E8L73QBp1',
          ),
          role: 1,
        },
        {
          address: address('38xsdNK9eQpZ82wHfRoAcpgvfPM7dSdciPHmjZcN5vxy'),
          role: 1,
        },
        {
          address: address('F45bCYn3drfWyPLGqcgjdc3LqWBBfqXHExFXgQv7MK6V'),
          role: 1,
        },
        {
          address: address('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
          role: 0,
        },
      ],
      data: Uint8Array.from([
        193, 32, 155, 51, 65, 214, 156, 129, 3, 3, 0, 0, 0, 38, 100, 0, 1, 38,
        100, 1, 2, 26, 100, 2, 3, 64, 66, 15, 0, 0, 0, 0, 0, 187, 242, 72, 81,
        1, 0, 0, 0, 50, 0, 0,
      ]),
    },
  ],
};

/**
 * Lifi tx message (base64 encoded), as received in the `data` field from the response of this call:
 *
 * curl --request GET \
 * --url 'https://li.quest/v1/quote?fromToken=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&toToken=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263&fromAddress=FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo&toAddress=FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo&fromAmount=1000000&fromChain=SOL&toChain=SOL' \
 * --header 'accept: application/json'
 *
 */
const transactionMessageBase64Encoded =
  'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAKF92zrulHQhiUvVcoUaPML7MFkgDu9PV2PudQFNTACzusgP5PMjWwL4nGY8i3EGxqLHt/i3x/EskcO1ftQjYqQtpGfnLp6qHLD5IgtqLXr5clzwoa2ns4KdysosGA2yFHtz23WlYbqpa0+YWZyJHXFuu3ghb5vWc1zPY3lpthsJywNxBrinkyKcWM0yri8Ob6fbj2ETlWbB74B2SrzsZMN6C4BwwaDiM+rRplk/q/cGt2LaqLiyL9NfyCspxpXOE5xNeadn9BwfdfxhMn/8ZHjK8vssId18c+FLwH7iGmgW6xIbYJw5nSQFXY35sr+XRBrEloGBGD2qlvL/IUiaM4WCMZ94a1plyJpPlHrRsL1rpmaXBIRfsU+Uxw+aLNkr6eu2dBBA/kB6qwUEagfnGzH2GY12XE3va/gn3W4Loqy/D+jFVQxPlP1Z4G+sevh2wThqw0Dse949JPNd06yvXZqbQfwZ18niOQ6yVpg59/9fRJ4XfcKFrkiP0MqWjdBqix8tDNjIXopKgOoJLo9T4V1Q4D3O3kiwrHlTAsv1lIE5imKD0N0oI1T+8K47DiJ9N82JyiZvsX3fj3y3zO++Tr3FUGp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAMlDnSfD6FqhBcOx/J+8cJIYNT9bT36Nf+mq53E5eDyZAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAACMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WbwHxW5grT0/F3OC6sZUj7of0yz9kMoCs+fPoYX9znOYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEedVb8jHAbu50xW7OaBUH/bGy3qP0jlECsc2iVrwTj1E+LF26QsO9gzDavYNO6ZflUDWJ+gBV9eCQ5OcuzAMStD/6J/XX9kp0wJsfKVh53ksJqzbfyd1RSzIap7OM5ejQuUxbSjVsF4ofsiNIO4j0bRr7uSBVpb25ttT6uSVL2wUNAg4PCQCLyxegTTCCABAABQK4gRYAEAAJAyChBwAAAAAAEQYAAQASEyYBARRDJhUAAgMEAScSFBQWFCgXKBgZAwUpJxooFSYmKigGBwgUKCAoISIFCSkrIygVJiYqKCQlFCwVLRsJBBwdHiYKHwsMFCzBIJszQdacgQMDAAAAJmQAASZkAQIaZAIDQEIPAAAAAAC78khRAQAAADIAAAPdfctSzc+t7n0tohMIoz7S6USQkKhKDRCUSx6C3SjhJQQECQIPBgcLBgoMEE6AspKYLJSa6SyoxyUWhV22aIWLPPv/IXXXM13pVIDGBSMkHh0gAiIhthEB96V+ox0SHgkdfHpVLcZenJ5aE0pCUGzH2bYjxz4GWhMSEBEUAA==';

const signedTransaction = {
  lifetimeConstraint: {
    blockhash: blockhash('F3mgS4DGisBt8Uc2MfM5r4ow2RcPFJrp333h7YSgTin6'),
    lastValidBlockHeight: 18446744073709551615n,
  },
  messageBytes: Uint8Array.from([
    128, 1, 0, 10, 23, 221, 179, 174, 233, 71, 66, 24, 148, 189, 87, 40, 81,
    163, 204, 47, 179, 5, 146, 0, 238, 244, 245, 118, 62, 231, 80, 20, 212, 192,
    11, 59, 172, 25, 247, 134, 181, 166, 92, 137, 164, 249, 71, 173, 27, 11,
    214, 186, 102, 105, 112, 72, 69, 251, 20, 249, 76, 112, 249, 162, 205, 146,
    190, 158, 187, 31, 193, 157, 124, 158, 35, 144, 235, 37, 105, 131, 159, 127,
    245, 244, 73, 225, 119, 220, 40, 90, 228, 136, 253, 12, 169, 104, 221, 6,
    168, 177, 242, 33, 182, 9, 195, 153, 210, 64, 85, 216, 223, 155, 43, 249,
    116, 65, 172, 73, 104, 24, 17, 131, 218, 169, 111, 47, 242, 20, 137, 163,
    56, 88, 35, 55, 16, 107, 138, 121, 50, 41, 197, 140, 211, 42, 226, 240, 230,
    250, 125, 184, 246, 17, 57, 86, 108, 30, 248, 7, 100, 171, 206, 198, 76, 55,
    160, 61, 183, 90, 86, 27, 170, 150, 180, 249, 133, 153, 200, 145, 215, 22,
    235, 183, 130, 22, 249, 189, 103, 53, 204, 246, 55, 150, 155, 97, 176, 156,
    176, 70, 126, 114, 233, 234, 161, 203, 15, 146, 32, 182, 162, 215, 175, 151,
    37, 207, 10, 26, 218, 123, 56, 41, 220, 172, 162, 193, 128, 219, 33, 71,
    183, 103, 65, 4, 15, 228, 7, 170, 176, 80, 70, 160, 126, 113, 179, 31, 97,
    152, 215, 101, 196, 222, 246, 191, 130, 125, 214, 224, 186, 42, 203, 240,
    254, 128, 254, 79, 50, 53, 176, 47, 137, 198, 99, 200, 183, 16, 108, 106,
    44, 123, 127, 139, 124, 127, 18, 201, 28, 59, 87, 237, 66, 54, 42, 66, 218,
    140, 85, 80, 196, 249, 79, 213, 158, 6, 250, 199, 175, 135, 108, 19, 134,
    172, 52, 14, 199, 189, 227, 210, 79, 53, 221, 58, 202, 245, 217, 169, 180,
    184, 7, 12, 26, 14, 35, 62, 173, 26, 101, 147, 250, 191, 112, 107, 118, 45,
    170, 139, 139, 34, 253, 53, 252, 130, 178, 156, 105, 92, 225, 57, 196, 208,
    205, 140, 133, 232, 164, 168, 14, 160, 146, 232, 245, 62, 21, 213, 14, 3,
    220, 237, 228, 139, 10, 199, 149, 48, 44, 191, 89, 72, 19, 152, 166, 215,
    154, 118, 127, 65, 193, 247, 95, 198, 19, 39, 255, 198, 71, 140, 175, 47,
    178, 194, 29, 215, 199, 62, 20, 188, 7, 238, 33, 166, 129, 110, 177, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 40, 61, 13, 210, 130, 53, 79, 239, 10, 227, 176, 226, 39,
    211, 124, 216, 156, 162, 102, 251, 23, 221, 248, 247, 203, 124, 206, 251,
    228, 235, 220, 85, 81, 62, 44, 93, 186, 66, 195, 189, 131, 48, 218, 189,
    131, 78, 233, 151, 229, 80, 53, 137, 250, 0, 85, 245, 224, 144, 228, 231,
    46, 204, 3, 18, 140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20,
    142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219,
    233, 248, 89, 3, 6, 70, 111, 229, 33, 23, 50, 255, 236, 173, 186, 114, 195,
    155, 231, 188, 140, 229, 187, 197, 247, 18, 107, 44, 67, 155, 58, 64, 0, 0,
    0, 180, 63, 250, 39, 245, 215, 246, 74, 116, 192, 155, 31, 41, 88, 121, 222,
    75, 9, 171, 54, 223, 201, 221, 81, 75, 50, 26, 167, 179, 140, 229, 232, 188,
    7, 197, 110, 96, 173, 61, 63, 23, 115, 130, 234, 198, 84, 143, 186, 31, 211,
    44, 253, 144, 202, 2, 179, 231, 207, 161, 133, 253, 206, 115, 152, 201, 67,
    157, 39, 195, 232, 90, 161, 5, 195, 177, 252, 159, 188, 112, 146, 24, 53,
    63, 91, 79, 126, 141, 127, 233, 170, 231, 113, 57, 120, 60, 153, 4, 121,
    213, 91, 242, 49, 192, 110, 238, 116, 197, 110, 206, 104, 21, 7, 253, 177,
    178, 222, 163, 244, 142, 81, 2, 177, 205, 162, 86, 188, 19, 143, 6, 167,
    213, 23, 24, 199, 116, 201, 40, 86, 99, 152, 105, 29, 94, 182, 139, 94, 184,
    163, 155, 75, 109, 92, 115, 85, 91, 33, 0, 0, 0, 0, 208, 185, 76, 91, 74,
    53, 108, 23, 138, 31, 178, 35, 72, 59, 136, 244, 109, 26, 251, 185, 32, 85,
    165, 189, 185, 182, 212, 250, 185, 37, 75, 219, 5, 14, 2, 22, 20, 9, 0, 139,
    203, 23, 160, 77, 48, 130, 0, 17, 0, 5, 2, 184, 129, 22, 0, 17, 0, 9, 3, 32,
    161, 7, 0, 0, 0, 0, 0, 16, 6, 0, 8, 0, 19, 13, 45, 1, 1, 21, 67, 45, 15, 0,
    6, 5, 4, 8, 42, 19, 21, 21, 18, 21, 43, 37, 43, 34, 35, 5, 10, 40, 42, 36,
    43, 15, 45, 45, 41, 43, 12, 3, 1, 21, 43, 33, 43, 28, 29, 10, 7, 40, 44, 30,
    43, 15, 45, 45, 41, 43, 31, 32, 21, 39, 15, 38, 27, 7, 4, 23, 25, 26, 45, 9,
    24, 2, 11, 21, 44, 193, 32, 155, 51, 65, 214, 156, 129, 3, 3, 0, 0, 0, 38,
    100, 0, 1, 38, 100, 1, 2, 26, 100, 2, 3, 64, 66, 15, 0, 0, 0, 0, 0, 187,
    242, 72, 81, 1, 0, 0, 0, 50, 0, 0, 3, 78, 128, 178, 146, 152, 44, 148, 154,
    233, 44, 168, 199, 37, 22, 133, 93, 182, 104, 133, 139, 60, 251, 255, 33,
    117, 215, 51, 93, 233, 84, 128, 198, 5, 36, 32, 30, 29, 35, 2, 33, 34, 182,
    17, 1, 247, 165, 126, 163, 29, 18, 30, 9, 29, 124, 122, 85, 45, 198, 94,
    156, 158, 90, 19, 74, 66, 80, 108, 199, 217, 182, 35, 199, 62, 6, 19, 18,
    16, 17, 20, 90, 0, 221, 125, 203, 82, 205, 207, 173, 238, 125, 45, 162, 19,
    8, 163, 62, 210, 233, 68, 144, 144, 168, 74, 13, 16, 148, 75, 30, 130, 221,
    40, 225, 37, 4, 9, 2, 15, 4, 6, 10, 12, 11, 6, 16, 7,
  ]),
  signatures: {
    FvS1p2dQnhWNrHyuVpJRU5mkYRkSTrubXHs4XrAn3PGo: Uint8Array.from([
      5, 187, 128, 166, 240, 124, 182, 71, 19, 166, 121, 0, 149, 227, 186, 255,
      182, 216, 155, 222, 142, 62, 82, 67, 94, 192, 104, 160, 48, 146, 191, 29,
      155, 66, 98, 40, 255, 16, 181, 40, 86, 102, 166, 138, 111, 75, 183, 106,
      251, 144, 223, 107, 67, 239, 160, 77, 113, 219, 148, 129, 139, 209, 0, 12,
    ]),
  },
};

const signature =
  '7eYiuW68MGFFveCCyiJYyDWXe3LpJnQiUu6au6kDEXmpAWLFAZinbLcFNbWDNsYVWtXNSbv2g2ys2mZBTYCmYKm';

export const MOCK_EXECUTION_SCENARIO_LIFI_SWAP: MockExecutionScenario = {
  name: 'Lifi Swap',
  scope,
  fromAccount: account,
  toAccount: account,
  fromAccountPrivateKeyBytes,
  transactionMessage,
  transactionMessageBase64Encoded,
  signedTransaction,
  signature,
};
