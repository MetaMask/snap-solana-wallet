import type { TransactionScanResult } from '../transaction-scan/types';

/* eslint-disable @typescript-eslint/naming-convention */
export const MOCK_SECURITY_ALERTS_API_SCAN_TRANSACTIONS_RESPONSE = {
  encoding: 'base58',
  status: 'SUCCESS',
  error: null,
  error_details: null,
  result: {
    simulation: {
      assets_diff: {
        '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P': [
          {
            asset_type: 'SOL',
            asset: {
              type: 'SOL',
              decimals: 9,
              logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
            },
            in: {
              usd_price: 0.98807052604,
              summary: 'Gained approximately 0.99$',
              value: 0.005669443,
              raw_value: 5669443,
            },
            out: null,
          },
          {
            asset_type: 'TOKEN',
            asset: {
              address: 'HaMv3cdfDW6357yjpDur6kb6w52BUPJrMJpR76tjpump',
              symbol: 'COBIE',
              name: 'COBIE THE BUILDER',
              logo: 'https://ipfs.io/ipfs/QmdWCVHoMvtDCAbgajnzAP7ZBNeBo9RgtkbqE4rJZWGYGq',
              type: 'TOKEN',
              decimals: 6,
            },
            in: null,
            out: {
              usd_price: null,
              summary: 'Lost approximately 202344.646927',
              value: 202344.646927,
              raw_value: 202344646927,
            },
          },
        ],
        DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa: [
          {
            asset_type: 'SOL',
            asset: {
              type: 'SOL',
              decimals: 9,
              logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
            },
            in: null,
            out: {
              usd_price: 0.37655198219999997,
              summary: 'Lost approximately 0.38$',
              value: 0.002160615,
              raw_value: 2160615,
            },
          },
          {
            asset_type: 'TOKEN',
            asset: {
              address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              symbol: 'USDC',
              name: 'USD Coin',
              logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
              type: 'TOKEN',
              decimals: 6,
            },
            in: null,
            out: {
              usd_price: 0.9998669999999998,
              summary: 'Lost approximately 1.0$',
              value: 1,
              raw_value: 1000000,
            },
          },
          {
            asset_type: 'TOKEN',
            asset: {
              address: 'HaMv3cdfDW6357yjpDur6kb6w52BUPJrMJpR76tjpump',
              symbol: 'COBIE',
              name: 'COBIE THE BUILDER',
              logo: 'https://ipfs.io/ipfs/QmdWCVHoMvtDCAbgajnzAP7ZBNeBo9RgtkbqE4rJZWGYGq',
              type: 'TOKEN',
              decimals: 6,
            },
            in: {
              usd_price: null,
              summary: 'Gained approximately 202344.646927',
              value: 202344.646927,
              raw_value: 202344646927,
            },
            out: null,
          },
        ],
        CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM: [
          {
            asset_type: 'SOL',
            asset: {
              type: 'SOL',
              decimals: 9,
              logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
            },
            in: {
              usd_price: 0.00988063032,
              summary: 'Gained approximately 0.01$',
              value: 0.000056694,
              raw_value: 56694,
            },
            out: null,
          },
        ],
        J4uBbeoWpZE8fH58PM1Fp9n9K6f1aThyeVCyRdJbaXqt: [
          {
            asset_type: 'TOKEN',
            asset: {
              address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              symbol: 'USDC',
              name: 'USD Coin',
              logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
              type: 'TOKEN',
              decimals: 6,
            },
            in: {
              usd_price: 0.9998669999999998,
              summary: 'Gained approximately 1.0$',
              value: 1,
              raw_value: 1000000,
            },
            out: null,
          },
          {
            asset_type: 'TOKEN',
            asset: {
              address: 'So11111111111111111111111111111111111111112',
              symbol: 'SOL',
              name: 'Wrapped SOL',
              logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
              type: 'TOKEN',
              decimals: 9,
            },
            in: null,
            out: {
              usd_price: 0.9980510188,
              summary: 'Lost approximately 1.0$',
              value: 0.00572671,
              raw_value: 5726710,
            },
          },
        ],
      },
      assets_ownership_diff: {},
      delegations: {},
      accounts_details: [
        {
          type: 'SYSTEM_ACCOUNT',
          account_address: 'CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM',
          description: null,
          was_written_to: true,
        },
        {
          type: 'SYSTEM_ACCOUNT',
          account_address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
          description: null,
          was_written_to: true,
        },
        {
          type: 'SYSTEM_ACCOUNT',
          account_address: 'Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1',
          description: null,
          was_written_to: false,
        },
        {
          type: 'SYSTEM_ACCOUNT',
          account_address: 'J4uBbeoWpZE8fH58PM1Fp9n9K6f1aThyeVCyRdJbaXqt',
          description: null,
          was_written_to: false,
        },
        {
          type: 'FUNGIBLE_MINT_ACCOUNT',
          account_address: 'So11111111111111111111111111111111111111112',
          description: 'Wrapped SOL Mint Account',
          was_written_to: false,
          name: 'Wrapped SOL',
          symbol: 'SOL',
          logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        },
        {
          type: 'FUNGIBLE_MINT_ACCOUNT',
          account_address: 'HaMv3cdfDW6357yjpDur6kb6w52BUPJrMJpR76tjpump',
          description: 'COBIE THE BUILDER Mint Account',
          was_written_to: false,
          name: 'COBIE THE BUILDER',
          symbol: 'COBIE',
          logo: 'https://ipfs.io/ipfs/QmdWCVHoMvtDCAbgajnzAP7ZBNeBo9RgtkbqE4rJZWGYGq',
        },
        {
          type: 'FUNGIBLE_MINT_ACCOUNT',
          account_address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          description: 'USD Coin Mint Account',
          was_written_to: false,
          name: 'USD Coin',
          symbol: 'USDC',
          logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        },
        {
          type: 'TOKEN_ACCOUNT',
          account_address: '3QE7UkXbrHxEbi373Gp5hwPQwJaAVoLvwYBRz5jwaGxt',
          description: "USD Coin's ($USDC) Token Account",
          was_written_to: true,
          mint_address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          owner_address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
        },
        {
          type: 'TOKEN_ACCOUNT',
          account_address: '3f9kSZg8PPJ6NkLwVdXeff16ZT1XbkmT5eaQCqUnpDWx',
          description: "USD Coin's ($USDC) Token Account",
          was_written_to: true,
          mint_address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          owner_address: 'J4uBbeoWpZE8fH58PM1Fp9n9K6f1aThyeVCyRdJbaXqt',
        },
        {
          type: 'TOKEN_ACCOUNT',
          account_address: '4maNZQtYFA1cdB55aLS321dxwdH1Y8NWaH4qiMedKpTZ',
          description: "Wrapped SOL's ($SOL) Token Account",
          was_written_to: true,
          mint_address: 'So11111111111111111111111111111111111111112',
          owner_address: 'J4uBbeoWpZE8fH58PM1Fp9n9K6f1aThyeVCyRdJbaXqt',
        },
        {
          type: 'TOKEN_ACCOUNT',
          account_address: 'Bg55CFRuAfbH5r86Y3UwEdvGZytNYSNKzWkW7jYC7jQU',
          description: "COBIE THE BUILDER's ($COBIE) Token Account",
          was_written_to: true,
          mint_address: 'HaMv3cdfDW6357yjpDur6kb6w52BUPJrMJpR76tjpump',
          owner_address: 'HUCjBnmd4FoUjCCMYQ9xFz1ce1r8vWAd8uMhUQakE2FR',
        },
        {
          type: 'TOKEN_ACCOUNT',
          account_address: 'HaMfinLwpZnjntMjbJa1D6WhVyRgZQXYzVCGSVrhG6rD',
          description: "COBIE THE BUILDER's ($COBIE) Token Account",
          was_written_to: true,
          mint_address: 'HaMv3cdfDW6357yjpDur6kb6w52BUPJrMJpR76tjpump',
          owner_address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
        },
        {
          type: 'PROGRAM',
          account_address: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
          description: null,
          was_written_to: false,
        },
        {
          type: 'PROGRAM',
          account_address: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
          description: null,
          was_written_to: false,
        },
        {
          type: 'PROGRAM',
          account_address: '3i5JeuZuUxeKtVysUnwQNGerJP2bSMX9fTFfS4Nxe3Br',
          description: null,
          was_written_to: false,
        },
        {
          type: 'PROGRAM',
          account_address: 'HyaB3W9q6XdA5xwpU4XnSZV94htfmbmqJXZcEbRaJutt',
          description: null,
          was_written_to: false,
        },
        {
          type: 'PROGRAM',
          account_address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          description: null,
          was_written_to: false,
        },
        {
          type: 'PROGRAM',
          account_address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
          description: null,
          was_written_to: false,
        },
        {
          type: 'NATIVE_PROGRAM',
          account_address: 'ComputeBudget111111111111111111111111111111',
          description: 'Compute Budget',
          was_written_to: false,
        },
        {
          type: 'NATIVE_PROGRAM',
          account_address: '11111111111111111111111111111111',
          description: 'System Program',
          was_written_to: false,
        },
        {
          type: 'PDA',
          account_address: '2SgUGxYDczrB6wUzXHPJH65pNhWkEzNMEx3km4xTYUTC',
          description:
            'PDA owned by HyaB3W9q6XdA5xwpU4XnSZV94htfmbmqJXZcEbRaJutt',
          was_written_to: true,
          owner: 'HyaB3W9q6XdA5xwpU4XnSZV94htfmbmqJXZcEbRaJutt',
        },
        {
          type: 'PDA',
          account_address: 'HUCjBnmd4FoUjCCMYQ9xFz1ce1r8vWAd8uMhUQakE2FR',
          description:
            'PDA owned by 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
          was_written_to: true,
          owner: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
        },
        {
          type: 'PDA',
          account_address: '4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf',
          description:
            'PDA owned by 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
          was_written_to: false,
          owner: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
        },
        {
          type: 'PDA',
          account_address: '8NsPwRFYqob3FzYvHYTjFK6WVFJADFN8Hn7yNQKcVNW1',
          description:
            'PDA owned by HyaB3W9q6XdA5xwpU4XnSZV94htfmbmqJXZcEbRaJutt',
          was_written_to: false,
          owner: 'HyaB3W9q6XdA5xwpU4XnSZV94htfmbmqJXZcEbRaJutt',
        },
      ],
      account_summary: {
        account_assets_diff: [
          {
            asset_type: 'SOL',
            asset: {
              type: 'SOL',
              decimals: 9,
              logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
            },
            in: null,
            out: {
              usd_price: 0.37655198219999997,
              summary: 'Lost approximately 0.38$',
              value: 0.002160615,
              raw_value: 2160615,
            },
          },
          {
            asset_type: 'TOKEN',
            asset: {
              address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              symbol: 'USDC',
              name: 'USD Coin',
              logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
              type: 'TOKEN',
              decimals: 6,
            },
            in: null,
            out: {
              usd_price: 0.9998669999999998,
              summary: 'Lost approximately 1.0$',
              value: 1,
              raw_value: 1000000,
            },
          },
          {
            asset_type: 'TOKEN',
            asset: {
              address: 'HaMv3cdfDW6357yjpDur6kb6w52BUPJrMJpR76tjpump',
              symbol: 'COBIE',
              name: 'COBIE THE BUILDER',
              logo: 'https://ipfs.io/ipfs/QmdWCVHoMvtDCAbgajnzAP7ZBNeBo9RgtkbqE4rJZWGYGq',
              type: 'TOKEN',
              decimals: 6,
            },
            in: {
              usd_price: null,
              summary: 'Gained approximately 202344.646927',
              value: 202344.646927,
              raw_value: 202344646927,
            },
            out: null,
          },
        ],
        account_delegations: [],
        account_ownerships_diff: [],
        total_usd_diff: {
          in: 0,
          out: 1.3764189821999997,
          total: -1.3764189821999997,
        },
      },
    },
    validation: {
      result_type: 'Benign',
      reason: '',
      features: [],
      extended_features: [],
    },
  },
  request_id: 'b731c628-e699-4a71-8a58-d2b578369a44',
};

export const MOCK_SCAN_TRANSACTION_RESPONSE: TransactionScanResult = {
  status: 'SUCCESS',
  estimatedChanges: {
    assets: [
      {
        type: 'out',
        symbol: 'SOL',
        name: 'SOL',
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        value: 0.002160615,
        price: 0.37655198219999997,
        imageSvg:
          '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><image width="16" height="16" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAH0TSURBVHgB7b0JwC1JWab5fufWvi8UUMVSBRQ0SLEXCDbasriwjIBoL4q94MIgIGrT2jrjgC2gqNM6aqutQnfrON06ttjY0AiC4oq0iIrsS1EURe1Q+14n5j+ZGRHv90Xk+f97696qW5Pvo3X/czIjvvgiMsn3jcg85xiABCGEEEIsihWEEEIIsThkAIQQQogFIgMghBBCLBAZACGEEGKByAAIIYQQC0QGQAghhFggMgBCCCHEApEBEEIIIRaIDIAQQgixQGQAhBBCiAUiAyCEEEIsEBkAIYQQYoHIAAghhBALRAZACCGEWCAyAEIIIcQCkQEQQgghFogMgBBCCLFAZACEEEKIBSIDIIQQQiwQGQAhhBBigcgACCGEEAtEBkAIIYRYIDIAQgghxAKRARBCCCEWiAyAEEIIsUBkAIQQQogFIgMghBBCLBAZACGEEGKByAAIIYQQC0QGQAghhFggMgBCCCHEApEBEEIIIRaIDIAQQgixQGQAhBBCiAUiAyCEEEIsEBkAIYQQYoHIAAghhBALRAZACCGEWCAyAEIIIcQCkQEQQgghFogMgBBCCLFAZACEEEKIBSIDIIQQQiwQGQAhhBBigcgACCGEEAtEBkAIIYRYIDIAQgghxAKRARBCCCEWiAyAEEIIsUBkAIQQQogFIgMghBBCLBAZACGEEGKByAAIIYQQC0QGQAghhFggMgBCCCHEApEBEEIIIRaIDIAQQgixQGQAhBBCiAUiAyCEEEIsEBkAIYQQYoHIAAghhBALRAZACCGEWCAyAEIIIcQCkQEQQgghFogMgBBCCLFAZACEEEKIBSIDIIQQQiwQGQAhhBBigcgACCGEEAtEBkAIIYRYIDIAQgghxAKRARBCCCEWiAyAEEIIsUBkAIQQQogFIgMghBBCLBAZACGEEGKByAAIIYQQC0QGQAghhFggMgBCCCHEApEBEEIIIRaIDIAQQgixQGQAhBBCiAUiAyCEEEIsEBkAIYQQYoHIAAghhBALRAZACCGEWCAyAEIIIcQCkQEQQgghFogMgBBCCLFAZACEEEKIBSIDIIQQQiwQGQAhhBBigcgACCGEEAtEBkAIIYRYIDIAQgghxAKRARBCCCEWiAyAEEIIsUBkAIQQQogFIgMghBBCLBAZACGEEGKByAAIIYQQC0QGQAghhFggMgBCCCHEApEBEEIIIRaIDIAQQgixQGQAhBBCiAUiAyCEEEIsEBkAIYQQYoHIAAghhBALRAZACCGEWCAyAEIIIcQCkQEQQgghFogMgBBCCLFAZACEEEKIBSIDIIQQQiwQGQAhhBBigcgACCGEEAtEBkAIIYRYIDIAQgghxAKRARBCCCEWiAyAEEIIsUBkAIQQQogFIgMghBBCLBAZACGEEGKByAAIIYQQC0QGQAghhFggMgBCCCHEApEBEEIIIRaIDIAQQgixQGQAhBBCiAUiAyCEEEIsEBkAIYQQYoHIAAghhBALRAZACCGEWCAyAEIIIcQCkQEQQgghFogMgBBCCLFAZACEEEKIBSIDIIQQQiwQGQAhhBBigcgACCGEEAvkCAhxD+TExz8Wpzz9K3HqM56GI04/BWmz0ab/dkiWxhfTtrJ/+Jua8qUOvR/r0TaL2zcbUtsmOA+4MiWXKQ/fVlvW5YaYR6lB+2K5NOXAhG3WROnHBo3p3F5LTVsxZrs3jDvacqUv3bhz7eUtaev+ZjvCcce2+Km/t9NXV2Jb3W6MuXj53LB+mZDH+pJrcNOb349rf/DNSNffArFsZs4aIQ5P9p14Ah74Pd+L0571zHmRj8LXmIDUMQX1b0/0Y1tjKXPxppK+XYDeJ2qjlm/a6pqAnmiHvqBtp8RzdTr1eiagax6o3KyIzQj6gRqHkON2U9LPcVZq5+qhHvP+RXK+T2lm+1xu8yXT1vxqnvP7MGNkbvuTT+LKr/63SLfeDrFc9u389xoIcQ/gqPveF4/4xZ/HCY9/zPDeNlc+q1c3cwJpsCLQYf/0woJBqAXbvzHWsKWIv1F569RF86bU7ZQvCYVtTQ5WY/prfOy3hTr1hdl8vdzHVj96g1r39MbK97ONiG6dtsgUvV/O5nO07gHuv62bbev+3ervrW4dm/447z4u5v6xPcTYufA/8DTg5ltx644REMtFzwCIewQb8X/4z/wMjjnrLD9pXmPU0em/oqt5kpUnRXl/2WfD1CmWH+tYrQOO1W4fpKXEm8rx1baZKBrlau2lP4Wy3B73x+Vhncn7jPL4pYLOBNHaOL2JpYtn7aZk/Rz8kkN5ZbnO1lzQba+N3d8e+9mPYiE3q8e9KcfxZ4Q85aNs/TaS32Zt9E7+HROQMH/XwbVTOfZfPBVi2cgAiMOefSecgIe94cdx9JlnDheyFYs5JmGeMQFVoNFfeXXlk48Zyjni9jTN5mN9bjcKWKICacYExPaiIIXtUXxKPKpjHRPg4nWE2LpGgQzUnDw58bLQXhuxNQ59E2G7CmqvbjQqvTp9+uLaPw5uj02nBrbU7+ScEEZ0Z0xSU7c/NrMrASGPI84+HWLZyACIw5p9xx2PL/npf4fjznmQF+1wMbMsHGwCkC++5gW9WQmYLpn5IjtrAnYkY01C2zUF3gSY28dmw68EzJoAFsTdVgJ6JD+b7TMn8L2SIXzzopYrUujEyxul2Va3Cjn6JmmbCXBjPb+/14P8fk8mIIU9dM425oChgbTZMrusRDSxoinzJiDdeCvEspEBEIc1D33Na3HsuQ8Zl1IHMdycsja9x3ALoCyb5gvwevzPnNCjXQkIJqBfhkWFL/atsIwX/CBwaWYFAtTuLiagFZKxbnclIHXEnFcCeBbeWQnwAsxSVI2IIQh8fpVmpasv+Dz+PpN5oQ7btgr6TN22Vmccu9jM/l4Oc2K/ZSafjeHcGAKYvbXTRvPVXImRW972QYhlIwMgDlse9N2vwinnP5GW5bNok6DRjD7P4otgrqnMeoiw5XaANSJbjcUkGbQSkLeX8kXI0ZqAXrtR/BLn3hOkGZHqvu6IT8x1Tig7qxaIcaZYUcgS2pZ7r+p73uv3p9zWljqtoeJyQHdGT/2ffTBwN/MwOxOP7YbRmDE8vXbYBlkskXarC1qtaC3BsNJ16x249rX/HWLZyACIw5Kzv+PluM9zX1DFnYV+mPlvLsTjasD4GuBl8yLs/F/PBCR0bweM+5IzBdUEWDEB0TQUYYn7YV2D0Qh+LpAstI1mW2ltZiUgt1H3keAmEt3UNu/FJopIzxlMezqGxfXzTj8Y2KtrezQBsR7mTUAvFm9Ju5QNAjyb35bc4ls3i58xAa43M0Zms/nqb/9PuP0jl0AsGxkAcdjxgG95Mc76hn8yCbC5GX7PEAyE+/95Nu2NAcoy6/DpgbwNCCsB04J8vMhHEzDcr22fLxj3ZrGzvtiwuE85uTZijUSX+FYR5j8dgJ4J6LQVxaIXz+3fRXQ7M92+5I35zD8oB+zt0wHW21P39+qmXtQ547BFsDFTthsfXcMzvjP0VgJspnRvXGLaxv/bmbju1f8NN/36eyGEDIA4rHjAi751579vQ1kSzxf3KOSowmnFJBh4lrxZGcgzfosmYFo54BUC/7xAZxUBIYdUZ/p9EwDElQALsQrRBKTxRep+OqC9pQBsWQlI0QSU7LaagNZUBIFKPcmKWzrCmawjsKAxsLb2XB2fcbPFxe5tD83vjwmw3VYncoyOGeptb2b48VzC/tmQ2Nym9nU/8ru47vVa+hcj4zRGiMOAs77+m/Ggb38ZNl+Okr+FLX89b9WF+D6/TvQa7tv3Uv6b6/AkPn4tsIUJWoibSda7MrffAujaIiXufm3wbDlz22qOafgeGa/nqa+/1F7tX2r7w3VIfdyYROfS1csYr73MpL4zma2TjyMwU4fqJsyU26W9XpZtvVAXYfxmyvSPQb+sIfFCUzMezcjskt+Ga3/kLTsG4C0QIqMVAHFYcO+nPxsPevHLwUv+dRWg3uPvz9ZRFL/M9ktZKysDbh94BaETO8MzbddmUL3pwb/+lwXV/dtWAty8t2wjjx7Kg5fOqXx/JQCtJrhnAjp1yBF5nQoOo7fKgOCYuhi2z8zbiO1KgM1Enls6n6mbYq1AwgEQx6C+d+OZgPYhyDr28/Hq9tYv+XLX/fjbJP6iQQZA3O2cfN7jce7L/lX5bZ3hv7UX5mICWHBmTEDeRxN4xO8JWHE9BBMAzD8YCDgT4B8MpLa4PLIwc7kgNr12c186F/16X9c6xqDmUPPmeKB95nNEm3us55dMau3WBNTtPfGq+VuztTNF7sScKRPMTopxdzEQ/sj4Y2Qz9bJR7dPvk4WUe9vL+9Ruc/WTzdXcud//57j2f/9tCBGRARB3Kyc+5OH4kh94A1ZHHdsKLfomgGeCfj/Q3kevF0uj5wWKwQCbAKsfGUzRBFjXBMz97T0TML5P/XK8jd+7GSKZmNzHXGPGBPgVAj8DLUWDYTHEWHU22u5j+gLmBbtnAtCYpTF/zjvWnjEOTNrPj/rRsUr9LGe375nOuMVzPrbRHerZ+N4c3fLuj+IL/+KNEKKHuw4IcVdyzH3vh8f92K/gyFNPna7n46mYJ+t1qurv39dJZarPCID2lbrJ68RUrtyvXdX2atzOrwjGeLSvMNX102t0nxXY608JN/WdjqbQNoBO+/3YyWkeOjETq5LTueTz4JjwdfyFZdZd0LvUttVtI+zt3rPhetOYb82nbS91L429eqEusPszATQOPS+CPbWdZkqO43jbBy7EFV/2WqQ71hCih1YAxN3CMfc+E495zb/DkSefSjPdUeU2187VNANvlujpW/7y/f3y9bz8kcE16ioBfeSvrARs3q+nmT3PtHfer8LsnWei8eOFhbT3v9aZsffvwY9tVueSr/2paXvbSkD72tD/dADNr3OeDZ16ebvLN35CIDqO3t6us5h9b528mzpFM7fHanKa7b+Pu3/4+Hmby96Nz25t20xJw+2fuBxXPvvfSvzFVqZpiBB3HUeffh887rW/NJiAlJ/CH6xob6Y/brNphWB4DYSn/RPrjqvXrAS4mTjAqwvjakKemSf2JAM1t/1bCeitDLj6u6wE9Mo1cTlmr72Z2OVTDuA4MzNh7xa8Xndnrqn9qPrMLNa92/akv/n3KeTTrVPqUV9m8+m3l7Btf2d73mJ7XUXY60pA7Feb2R0XXokrnvEG3HHRVRBiGzIA4i7lmHudicf9m1/EMWec6QS1iG1ekzK4WwJ8Qz/Fj/RFE4AaJ5X4ZAKmOOP+1hxwe2lF7QLztyYopjMysS0AfiLIpiOU47rldXLmqPxPuGNsYoy52I2Yc30L0nQAJqCJvUXQ67sZQd9mHDjvTpmmL50yxiZqr/W2mID2o46dsuZKu7CpMz7bxu/2jfh/1Y74XyjxF7ujWwDiLuPI40/Go/7VT+6YgLOG9+XalVA/orce/xuX+fl2QH3Kelz29+XLA4K0Hfkv3SJYracl/nztzR8RpB8PMmrPptsE+aHBfGtigNrM/cjb/fvpRXlP/R7Uxe+fezDQyqs8ZpvaCV7h87iabw/bXncUKvl2SqmOFs1osottnW21jvVrNFNi257zTNs+196DgcZF0MuxX6+phLYvu+cZPZlty6UpheJKNzP/K5/zf0r8xZ6Zpg9CHFpstcLjf/Df45TzHluv+VZn4G4VAHkfgLIf4fqf/MOCxl/oE24lgPSwO+NPbl9vRWBTxlBz9g8WptqXzYvOPkz7eqsAOQdeCWiW3aseo10JqGNSB7wzk47tIW5Pfd3l1YmYV6/enCNobjfMz2RridS2NdNGdxxCmdhedx3B6p/e6sd+30YAZm4FUNlO3d3Gk/NbX3EtrtgR/9v+9rMQYq9MVxwhDi2P/u6fxBlP+konuk7Y8wWZ/zYmIddFvYB3hBpkHLzZGOvk195spJrXhpWvy20ll0fyMYZtY4E0LW0M0m9WjQJf8POtijyTj0/9b94noDvpA/ezI+hseuI+VFOT3PZDaQI6sXmeG/rhc0htnW0moKnT7G3GzfidoV/X+gagHUeqw1tmjcB8n8Z6/e1DNrfchiue9nrc+lefgRD7g24BiEPOQ174Utzn/Kc1T9sPT+9vltjzsr97oh9uGX78L9fNceIT/JiW9+vSvdFyfPlkAKay6xrLfZIAcL8wmK/sRu1Un1Gn4fHLhsb9q2EZOKX8w0Gb/9HVdup3DnS+ZyDnBc6D9tNrYzc1kXN0boe9wF5uE4B0NNW2uk/Vb4nBZSxum3nvtdTaMml/6vThfiTnjmYqhP7nf1O33u7t9+J3N7m+eif4xZf+R4m/OCCKcRXiUHDuN7wMD/q6F7czaaDOpi3OyhPtG4v6FYO63D9+KiBhHfQvrdo4fnUhhRxAM2aapW/8iVuB8PnXuFNeJV+4mbjrQ9w2tFVXCEr9oJauPrfRW/rv3g7w/XZxqWwunbra3JkJ77oS0HcUyYVOW+skih23csxI2laH2uq1Vvd39hnFn9nXjZe3dPI1xDHtrGyElYCrX/XruP7n3gkhDoTxnBPiEPCQ570E577gJeXeeBqnvwPDha48qU8XvRUJGAty1whM+1ejiCYqP4qxASSaaYpt2WyU5QRMhgGl7MZQmLXL/uPrNbXT2d8xMM48lIu7OdNQ+xRExraILpum8r4jYNYRURYxFi0WGYuT2k4urg71sxcvxkFX5uYFcKsJmKmzh1sB49a0JW7YvluduXq8pWta9tKf8c813/+fcd3/9XYIcaDIAIhDwoOf82I87Bte0c5qWeRoBpvy/lWRqfa7AUqM3i/7JS9+WeSpjVLf7U9eaF1bPvfeA4exTGwrRbG1VsCb8QBvG9Y33DME06i04u7E2efitoeyJeL+mgDO09Wp8dwFxnZfCdibCcC8qG8zDmV/E21G0Hv1+rE68j5fj97P36Xo55sjXPva38G1r3szhLgzyACIg84Dvvwbcd4/+0EvmOUCizLTH97XG9VTGRtMQLLOU/3T+94SvnswsMzmaQYPeBMQvicgvx5Ei4yENxdwf8uFn4yAn+GP7bjbArl8nMmuwhJ4bmvzEcHV9D/TaCJy2SmTMXfKiVYZuGzT/p0xASycjZiFekGcc5zt4jm3N20R5Zk6h2IlgNrcbmT6+/b3ocDNv9e+bkf8XyvxF3ceGQBxULnPo78ST3jFT/vZKt+P37x0Qtr5SN0KJHZAXSFIXhyN4k6xjcW401ZuIy75c+wo2Mk99cciD7qVgNYIILk+DMlFEec8kborBsNDhJZ2FfA8RhbNCXI5MiUJxVz5GEFYgwnI7YByboQzCmVjAlwU32+E/d3ynT7tUqdrXjpxc/39Xto/UPOAPZgAqn/9G9+NL778P0KIg4EMgDhonHL2eXjK9/8n2L59TkinR99boaP9blZt1ghy+ciaE18qgxSeH4ifuR/jctuztwC4HdqXLJoaeDEmc5BCvHjboqmLkDPC+MGa2wfdHxoi8RvNQH28Ln7sz82kg+jv9zcGNv1h9mACtt0O2CboW28FzNSZWz1gbD/FnMcd2Hs9et+/HZCQL9M3/fb7cOWLfg5CHCyOgBAHgePPeCC+9OX/DqvVEcP0sly28j9r0Mx0/Aa7QY6mi56lPGM1uj5X8bJmC0qUsVpWmM0/qxy9XmY3H7MbDEKtZdP2RgDRilH9Od5pqX1dRXJsOw2f6MtaPr6wEi+VHpBAJCqS+70TPH/98Cb8mN5UsyxxjAM0lB0KUZ5TzNpePQ7lI4s7ydu4YRylFEQqoa46xP6kRF+XWwK7cUopimKo58Yn1TgIsYvTSXWMyvkwhUlWTR/v6bRR6rizKOThtvqzrQxGCn2byXH3euEMSz0TMG64+V0fxFXf+SYIcTDpn/lC7AfHnXYWnvLdb8Kx9zpz+2wa08w5PiRnvC3OyIsiTR/1m4ubujPhvHw/9wxBcisTcN/9396eQHuvPwvWivLP/XQ50iw41+v0ufbP3MpCzaGOSfYu6+5sHe62B+dW3nNOm810XLi8wY81Qr2St8shuXHt1svj0omzfRbd25vatkLM/apDbc3Vnm+vV6tXJ9TLW0K+t3/087j0aT+MdM2NEOJgIgMg7hQb8f+yV+6I/+lnOWGvYjW95h+8MRa9/HE9oPmcvhPMNLv8X9vsfTqAY9a2y6yxbEMwCfmC3caMba/pocOYm4/rxwdhnOJ9/WYZ3pWn8QS6S/apjEEVn1K3d6thJl7/Y4VbTMDUTrm4dEwAmn1esLeL7l4FPW6bsRXbnglgs9QrcydNwGTlfCnK544Lr8DlX/063K5f9hOHABkAccAMM///9Rdx/H3PCUKMKpzw99wH+P1wsasmYNyfqnitvJHgj+BxOQvGIsV80BHuaXXAz+S5Hj/lX3PzJiL2hwQ9xu7FbAQ/GB/EPk/5uTGh/oHGA6Dx8Z8yiMZg2JZq/1y7mDcBzZJ1NBuxTs6QzUNX1INR4FcdQU/T5rT1mYC9GoeDYAK6dbbV8/s2/bjjMzvi/6zXD7/wJ8ShQAZAHBBHH38qvuK7/+/h3n99SM8a4RyFbbo73hHoKuTjJbx+RI+MA+jvKgjMqhUn94VDwQg0T9MXk5K8KJNIlhj06QSEVYR2BWGMi64xqQI4txrQbQf+QcC4YuBE15mFus/ILIzPYMSxy29SYzjKMUaYVVtrWFyOebMFyd6jCZiZtzd1YmyuM5qDTgz0TUB8SmBXQe+1N23fuwmo22//7I74f+3rJP7ikCIDIPab1b4j8Q9e8Ws45exHBiGb5mHWu+fOM2OgmX3G+8+zXwIE+GX5/iy9fPSwfPNgbdPd97fkbk+kYBLiffTxGwKB+IxB09eOCdj8tzY/I/XPQeS+B1HhfvKYhRkjOKemPhkaoPzwjhdgLgc03x9QYsf7+x2hXvVNQCN4jQmYtjM282T9VkEH5j8i2F7yeiYgRJsxAT0D0M9xu5Gp29eXXo1Ln/HDuH1nBUCIQ4k+BSD2i31HHIPHvvCHcOoDzhuuYcMD6eVpcZsuZuNV3T1EllBmgDZt5Qvi8DC7TTMv2/yYz1SBxGYMlyNMl+zN0/18v3qKPT6lj/HHdizPyKaW17x0bX5fjj/lX7eOkVecwZBT6Afic+O0ZeNHzGjVwahPNDZrero/d3VTNpuTRJlngU02jWEqPXKCk8efxivXnwZy6k9tM+UNeVvu73ScQJ8kGOtRm+ta14zzBAnekFDn0wEtVrtR36VUzzdeaYCPV4/vlA/qMWhb2bIthWRiLgh927SaD1f30wEdI3L1jbj8BT8h8Rd3Cf2zUIgZzv/G1+PsJz3PzzJp5lkfPON9iWbd7Wx5rDvto/pum9W6Rbynb89zDwBS22XGG78ZkF7H2TfcSkAbqwhZ+PSA+4SCdWbknXHhmOssSHTrop3Jx/6jYu0sdlzmT1S/bTf3OYWHCoecqE2fB9kLOsYlbze7pderUA+1Xs2/s4/i+ItVmi+PdjzGop3Vi17t3uqB2w8cyDMBsRZCjMu/7g24+d0fhBB3BVoBEHvm0c96Fc45/3koqksXumHmmfKc11/mxhk9pgfR6ux2kpxpZjm+KPep86Rrasc2Yp9fpzwTrp+tB+oMOM7A8yqAvzLnRtI028c0wx5npaVEnkVanUUOM1r60P+m7iqVaFNdc68nOQ0ig6Lmq0mE0zqVWSsHTqhjXsZ3XbvkhD7nnErhsHIQZtzTSkSZJU9/VjaOPx+TVIqMB6LEmd7bNOMvtxfKskKt501A7sAevifAUmeuD8x9Bn86WvAinzvStsHDN+RqvKc1Ad1cXGwqVU6GGKvWu+pbf17iL+5SZADEnnjkM1+Gv/cVL0b5kh+jL3zZUMQpkbCNom35fvwgaChfYLOpb6vpKpvvTWMU4LLMnCU+xWsqi6UVkTMShTxT5ksupVZFlmZn4/7xS1n6TP22KjBUvQp2MRR552rqT53Jci6jgRlV160m51sZJKLZhPAX7lgqtqB2eNqefJZk1sYfGio9G45J6G0WyfLlQ9Pbkosfm5Kk1RsR7guLpuM15F4MiG8DPEBMNpgWZ9Es6k7GJxPHBzyWp/chZkqdOuD8ujdbOvlHq9DWuuY1v4kbfuPPIMRdSd/aCkE88unfuWMAXl4u1jyDy4JTl/NTWZpelxlyvX+dr9HrLKDu6XjAP1U/iWWOze3n1/x0fIgTv5SnflkPOmWrF0jlIcMqAL3bFf6BRd5fP1XA7dR6Pm4xC1O/UsnVSPzDpyLgcwD9TXQMOKcClV3nWbWFY8qCWX47ILm6UynMfW1w4lsUpRy7m7gcX9tInXgUyZdBKGO+PI9Xt/y2Os44hDpTvb0/5R9zHOte87rfwjU/+tsQ4q5GBkBs5cHnfyOe+Px/Q2ILEv4guquwfdo8fy8d8E/0R0NB7eVZ3wreBABonhXYbFttydWZjClJIzGa/iv35V1d36euSUGOva7v+bcDXJ1U22IRsjmjwiJMn4Dg3IuwWjOGBRKmZqyRnBlCZxzH1Y6pPsulwYs254a2nVKfhXIvJsB6Yk3vZgUdmP90wPY69WLZmoBx64wR2GICrvmx/4qrX/tbEOLuoJ7TQgQe8vh/hPOf/8OTsKRWZFhMYV7MkTriZe7CHz+i539gB1W0SvtGAk0zcJ4J0yw/9WbwLISrUL9jAqJJSaGN+FBjcnFHE5C/V9+tFBg/wMjjCbDBqWNsZbZtQGeFIswsLcyuuVzY5o4JHa/hEQPD7OpAucWRgrmg8Sj9CrFju3MmYGqtEXRQHvMGoFenk+ueTECaF/LZuL3Yddt1P/c2fOEHfg1C3F3IAIgu9znnyXjaP3vTjpitSDg3e8JMm5e6ATIIPQH2s+V2KR/wpqHu88vogF9F8O2lsKrQmpdgECzm58u7nzN2/UxdE8CixG2MM/3khMYbEzQz/DXlzIaljAWPIb325ayWQ8cYuOPnZ9kpFyp9TLQyQjEAbyTQ5uQuNKtYbnyisYpoMB00JhUeBzTba249i5C6ojxffksdaithbybg2p9/G774/b8KIe5OpiuDEJWTTn8wvubbfwNHHHMiEH5Cd0PzbXoIQgo4Qasz1lzW0J3lAmHGGwwCmwAq280tGJbhFX1s0Dox2VxEQxLFtnwhEKLI+xlvXMlIXYH2JiE1whkMTewnUMV9eiYij+Eo4mE8ARJ3IJqB1JgAQxT8euxacevdakjdGT3QWw1wRgXB6FmJ4HJst24XdCt969TZUm9XEwDMrzBMcW/+ow/hsue+Fki69Iq7F30KQDhOPuNcPO2bfhlHHX3SKG6pfrEMQBfPzYvp4bC6t30N+vhW3pqfDPcficrP/GfBAfhncAexzT+Ti+nBwhRbnPZmDaSl82FP/UbikkP+dcJ8zc4tbN5n0bfhkwzTx/SmizZ/IVD9yN/0vH2um0BfUmTTpx7G7eM99nHG69ue9CybpM74j/qee0HDODmtNP2tI2LTGIajk4Uz+WEsT+3n2mwCkPtl7tgbzcZd/UT5Jnq2AC0l7dipPI4J9SeRWYjpHEs+WhkwI4NRys19OoDy7ma57dMByOeDPydz0Fv/+jO4/B/9hMRfHBbM/W9RLJATTrk/nvktv7bz937D+9598fo6UZnhVV3Cnso0M+Hm3vk0Q42z/fy6+ane3E47K3SrEkBzG2Asm1xezdcNh1l6wnw7s88XTO2kznj5FY/efnRuS/DYUlk3trVOzmkdZ+auHOWO0A9Xxx/jZgZsdPGwelyqbvuyoPoJKGYACOPJ/Sm16IFK1HHhMu2MntrkOn5rGwepzbndi+7DhJjP57a/uxCXf8OP4fbPfwFCHA7IAIiBE06+P75qI/4n369Zxq8iabPCn+l//I1FJr62mXpxaZ/2BQMwH3+Mw0Zi9qOF3ZjeMOTXvaX7ZsyobhT5Nv8wlmwgmn0gk2VtLgh9gh9Dt8xeyvhtdexyPGoDhvYW0DTOQexdboATYH/OwIvpjHkYt/VuXaQ2VzA+dt8EYF7Qrb1EppntQPszyJuMb7/wClz2nB8efuRHiMMFGQCBY487A1/7z34DJ5z6ADQzvCBAXhiAOAN1s1iKUZZ+m5lzckJo5p/ujzEGeh83JOFkQXGze7QGojEZKxZUEtiVzwWxL/FBwZkx8Dl0Zthx5cLN9jt5u2OTgiiaMyklF6Rmtl+MAJcFfNuxz0D5JEAzK95qAmisQIRjVI9rboz6OjOrL+9t7yagvks+P1d+L3XaMhtu/+zluFTiLw5DZAAWzhFHHItnveg3cOqZjxg3xAtoT5yAZj/gl9LzPKg3i3cf4Zvilnv11v84HLrCnmi1wGoueTm9fBFNatvmOOgI6qonsuF2CIl0M16ToDYzeRLGaFxYpHkJP81+7JD6DfhVC4TjsoE/tx9Xc5A65s7vZ3MRZ+HOoDVi741AfvZhmwmoRicKLPx5WGKkpgwbFfdqRtDHLTOCbnPlgXYloL6//ZIv4NKv/iGJvzgs0UOAC+fc816I0+7zJTuKwzNzK9f74VI2zL7GKdjwLNZ0MaSvzR/35ctwmh5bq9pUJnCJy+b9KX/fvE11+XI+5rIRQZveJ/o3Fxlipymf1fRYXv6WW7Om3+VBwaktzjMnukokbDZmXeqjLvVajmXU5PSAoZUB5LGcYm2ELOXxQP22vU0Xpgfphk3T1ybGTI0VboWS7CCy+ccJpoM0jPU6H5Op19N+y4Yg5kojXn4jYTqw+aG6fD5kDfTHmQ5Rzov/5n6wCcjBppTGPoUVi0SPXU4PZlq+lZQjpSkLd+inbbmx5nv5pzJ0HFyd8DXDZW8qnXR10vU347IXvE7iLw5bZAAWziMe/6LpurUqosBf/lKvn1Vsi3qSHqWsBPniaQD/VG7+nnlnAqYNaSo7xoEzH8VITBPGtMr7JpPCPxKUZ33rURjcT/MOOkLCklccUv553Cqv+Sdzs0EZQ07tZVEmoUirKp6raXiGPNeGqg2j0K1XqJPKzc5Vcr9lw99bz6I6HqHpEw75q3mn/g9l1qThQ8JWfpeAH6ivgj2ZCvoIgCGPC/+M7TRGpURyAk2eAUZ9CHJczwejH40awm3Ou/XUNsoxiW1U44l8wqF8eoMKNU/g8zlnpUN1YLs/IAR3bnsTEGK4OnTQ7ki49IU/its+chGEOFyRAVg4p552bhHQor4Aym+mx8/5TRdN/kjVOAPli/q4qV4Px/nyRvvWeebKHiJlA4FBtAz8kcD8kbtJmOgX8AbyjwqU3KjdFQn/IJBWZ+hIrsv8YTsLM22AVgPgPdCmlq2nGXLpKcpSgK1GQcyrCKt1KnGG+msSjdIiraCkKlbjMxJZ7CcxXU9/QXo2xUw0NqU3RTTzoc2rAWQYQB9PDF7PC53/eB2yKTE0E/DSXxbybASmI5zcMWETMFVILNzVkNTTwfyqE7kTt1rV/UW+KOh0cnKZGRNQSGPDl/3jN+CW934EQhzOyAAsnFtuvAZHH3cKzbbrlXK8WLu5X7mI5wv0uK3+eh5fLgv5Ym71N/GAKnRFkShAloa6TE5ilffn5d88Kx43De/XWUR4pppn6JwaRS6Uz7gnEgJvDPKKRq2f+4my9J9NTe7L+OuF/BPGpUGwuBTfZVbEKrHQGe1P3jDVcNWQOBmmWarXsXHQklu9SWW/uWOJ2gMW/NIGwooBaDUj33KgEZgOXB4zS2TFylJEEHHQ+ZlXkoLAjyPNtztSNW9RwN0J2zM77XGK5XP/vvB9b8RN7/grCHG4s4JYNJde9L7xGs3/0dW5CBumfeu6fVNulcZZ6vBlOSWGjf/Vj26PF/U8Qwz/DUvM66n+2kosTO9XeT9q7CHWuorDMMPfbF+P9VbrMdcSf4qFEnt8vVpTH9djzljXfqwoF/BryrPun/LLfZle5z6vQr+afFBjjTlRzNLvMcdVORY1Rh4X4+OVSL9cuaraNv0f8nFc03mQofOB+1DHxapDBPeB3AEdQ6wt5DZlUm4fcI7lLIJFo0j9Lu3SeHL/gmbDPRvi2gkk3k7td+pc/frfwLW//HYIcU8g2GCxNE497WF47j/5DRx5zElZ1QfKtdySv64bK0Et1/xgjNufQtz4Ube8L1G9NM3qrc3Datny8TtMcVYUBwhPwNOnD1ahPet83I5jmM+by6ZYJ49HJ4f6dH/8hAD1wVKn7Zp/KW9eg8rH+/J/0/MF/vsK+scpT+WTU9ZwvACnd5z3+D6WoxhhGx/DaWvIhTTd6CeLS/v+vCzbVjPt1Rp1rKkenJb7S2KNl/xWHotbbsVVP/gfcd0bfw9C3FOQARC43wO/DF/xNT+O4046iy687UXffdZ92u4ujiyA7kIPf+EmkeIv5jEW9iBQVRBTa0ZWsWzyJqEjorlfqcmb+xLLwgl1ioIV9vcNQ47rx6c83FhySq7dRujz2l1+CDAbHIT+8jhMpiqbFndc3C8xehOQxzr3IedZ+tkYrtT2mZcQwMeili3PB/TMAzrjEmPm0eFcQn65XwnJX/hY3HOdErFTZtqzvv4m3PzHH8KVr/ol3PH5qyDEPQkZADFwwkn33zECT8G97vsYrPYdFS6Y45/y+XGkMMtqhaCZ+dnMhZQEym3rXdRjmRDP/eodlS2iCvT7lZ9BYMHnNoIY8/512B/bRW/GDRqvqX7aMm692a4zZxbj8fEwijvJPuXQHJNeG7TfPaiXywGtaHbHeSxjCH3N45RiWR+zMZFAZ5/fH82nNdvqvjZemtmbcMeV1+K2T1+CG97y51hffT2EuCdS/vcghBBCiOWghwCFEEKIBSIDIIQQQiwQGQAhhBBigcgACCGEEAtEBkAIIYRYIDIAQgghxAKRARBCCCEWiAyAEEIIsUBkAIQQQogFIgMghBBCLBAZACGEEGKByAAIIYQQC0QGQAghhFggMgBCCCHEApEBEEIIIRaIDIAQQgixQGQAhBBCiAUiAyCEEEIsEBkAIYQQYoHIAAghhBALRAZACCGEWCAyAEIIIcQCkQEQQgghFogMgBBCCLFAZACEEEKIBSIDIIQQQiwQGQAhhBBigcgACCGEEAvkCAixwzlnfjnOf8RLcZ97PQpHHXE80majjfvG16m+nkg2bXHl0L7feZUshXoTq1p22J7byWVKrNrO5m+a2knjnrAv1dexXn5vNb9k1Ee3Pfn2hn5QTqF87k9y+6g9C3225MaQ+1Ty2vnPXPuhLOezorGz5PrH/RnKWTheQ3mbyuy8XvEYpTa3VW+8aXzKuKYS3x9Lczm648NxO8ew9DEeUzrP/P7ax4wbx03P+bjz8QDnPLWzXuOWCz6HWz97Ka576x/j2p3/hLgnsjmdE8Sieepj/hX+/s5/+VRIHdEtJwnvK4KB9gKNVhzZSKAnuhNO3NCKcDQYTpzdNpChiPmk0I43IH576gjajLhP79dBFKtQp0aUh5Irn1Nu1wuqz628X0WxT02ZKuBUftWahNqu71sdA6qzmi4gBifAyeVhJKgk5PC58vueoeuZgP6xT43gx+NYmI6hOzbFkHbO38kc5ddD33fK3/a5y3DlT/06rv7Nd0KIexL7dv57DcRiOe/B/xDPfOLrxgnZdKUr11Kzadv0L108x31j6bFuuLaaj4VSxii+b9NcuVyNyidut+Zj0xujBmsuVveV3tTypMlUwiVAdf0IDblQP934UC9Yt9y4JOqfURvJpnaNMxpfufSsKLDXRnN5+OOCEj/X4/3onQc1+5ARXLmUW0x1fMbZdRg5o1z8kZrqxvhtXXSOveUxDCedNQ1TbHfyFkdRj1M4pvWcG8+rTaf3nXQCTvyap+CI007CDX/xdzuO4HYIcU9ABmDhPPvJP4UTj7vv+MZ6MkcXaqt7m32lProX4LL6WoTOi+54wfVGgyU0X3wt0XvKYfxrvh4rk1WxYJFCbttie5QurCup5rOjmFy31kg5dxIqFymV9KqI5v0JnUzG96nJK4u8lSmsE21q18VKvH/KmfPiuEgcEVWIqX/TthygZJHMnTOUkMvN6CB6E8F1+bjW3NE7B42ydsNhLhXE88kdVusY4XHDsY/7ezjqAffB9b/3Z9C6qrgnoGcAFs69T3lEucCnSSgBFpqU/99dU8v7sq8u9bJgbC72eRmabsHubBsbzPqQivhZvXhutq8SCdHoADZxBn3cCMnmzZpzGsukuoJdyk43LWof05hzqZdfD6nlEUjlX/OjgFLYck2wbPpx2fm7mlpL6zHvBOrPVBIJNLhjXS/WqWzPb1dmU7XkS9XOlFyGmsO4TmOXci/p2JXxpLNgncqzCOP+VT34062EIdyqHpeUpmOMKYeV0WpFcv3zmfMo17EsQ+uHAjV1K8c3r3KkfFKPgzydbzZuN64fx3d8vRH4lOgZATJxif6Hkc+lk57/NNxx/U249Ad+FkIc7sgALBzbWQQaLpvDxbEo67AvWRWwIvZZeIEq7MiCQ5ftLO5WAk16kcr1uF5o84U5ufc5phc2o3+n1stFPLkytY+sG/7in/s19q3Kt00mIkvDKJxWHvKrfU1B6PPr2ieQCbDa2CCc1VaM6pTWKOJS8uVebcaePrsTx3MQt8E0pRKLzcQozjtv16Mgs7nI/c66xkKaj102iqWeTYZmerBwY8bS1J5N74e0VmObxTAloI4u8gEcxzg7xSnXlOhYskEso5/3sUjnbk/HexpvY3OVUnOC8PmWyFZwo+Uoz5iAU1/0bNxx1TW44id/FUIczugWwMJ5yJlPw0kn3H8SuXwxNiAsuTbL6xgveGVh12ifoW4v/6LEyvHjPlAsdOugRDR6VcvS3ppI7VmOa6HN2LcEH9+oXHKJwT/r4PMxl72Vhst4pdo2mv4Y5Qi3HD3mSCXjeJkfFXBW5rfkDrtjH/pQzAXgjg+4X1kE/W4XdSydmmPnMswHisxk6TuNfT3n2jhWTxS40yCXS9SOy7Z9WzqFacWEi+RnKMx8Pjvbj3vyecO+G9/7QQhxuCIDsHBuvvVqPPLsr0cj4kAVq/y2TCctCAhdBBHEluqxODiZye0a6KIOt93JYhTDRgbabY1R4Bu5yQtbI6gcx6xzr7/NhwWxjFmqwUt/k4/v+p9ag1Pz8L3yAkrbEosl4B8YpONFJiC2hXJcQn9pNz9vkP9N03ajtsAxw2s+gxKfRHnVAgB9OAFw54k/J3PfSyk2RWzaQlpjyubHjHM0NyToDE4pd9xTHo31dTfgpr/6KIQ4HJEBWDhXXfsJHH3kCbj/GU+sF+BwceZrZHlNF13/UNS409zVMwhh2G7holxNA+XSaIe5/PjC6y/aQfCsSpGFfMqe1LnQm4Vx8Koxzvw4v15ZL9j8TMRAbjfnnVcMzNkw7hqslSLXOJuq8X12JlTMCay5VszFNtdfxL6aPzZsAmINfw7xGIy1rA1KqyWMwR3/6fiV8nwczeBz5+NinfOeck2+fve8ND7vxzLHf+X5uOPKq3Hz334CQhxuyAAIfPqSPxg+CXDmaY8BgtQ4oYR1hHH8pze7bwUW1SCYj2HoiBfVL7FZ2OjqbmVjuOhP231uPkPwrQygOwN0y+Aklk5KqnrDfarB9avOc1lkSj+dAE9ZJq6H+jFBp+WWb+JTnShihmhGLOaVc3J9D/tyfDZt1DZlXldLchvTikR+tMCi0NJx5XNj7F82qDS2VuOVlo2NC+WUOKZRv5vGKOccE/RghD8PXOEmtuHEpz8JN3/kAtz6qYsgxOGEDIAY+MTFv4d7nfhQnLH5VIDViyv8hBGjUHlBrf+EWRSCkE1x8uNw6Fz4jUQUTjkNfjYKf7Gm7RYu5FmcLeTj25y2c9+cYFJs6s8YN5X8yl7j92hyd3pS2ltVAQE6/+a+hfEPuY0D7dvm8fK2hfsbM6V+xnoGb0ysZwLg+uMSnvrhZuvwou5jgP9xx3Jsuz0ZjHMr/cjbUhmqOkLVYAyb+dYQnZJWKzpzC3eumEvwhGc8ETe85/24/fIvQIjDhXIdEuLIfcfiRU9/M+53xvnDe76mprBePV77U1sOfh08lfr0ztzt4vqav27Y6hPucDGonmt/eoqcdcCA3tf1cr36nTgUa4rH7eX+JgtxKM9Ulir4q3M5D/6WOpR8yzfM2bj47b+FL7m2Sp2SD/Wb8irvy+v6jYM83us87qVuGDdrxyaVY0X9XFG5/K2GuU752uDk460Qjk2q59nKH4PEY+bKx/xTc56MbaVwfvE3MHbOj3JcqwN2/xugY1BiwZ+Lsc4dV12NT7/ge3DbhZdAiMMBGQDhOOaok/Hir34HTjvpIcN7L+6gi2q+mKZG7J1ghvheVGcEHnThnCmfOmJey8evBS6f0yJzATTf/d/dllrhCULOXyfLX0k7ZLLifJMXWM5vih+Fu1eOx8B9Ra/rM1oj0TUIU/6rvglIlAvHLvuRwjYqH8cv5FvaKmKfjxEd+97x645p6p8jvfOnHL9UHjYsX+3L51WO3+TCMUPbaPvN+27/4rW44LmvGL4+WIi7GxkA0XDsUafg2571Bzj5+AeiCH0wAkYXtXIRRMcEuPc9UQ8Xy+RFlOONefRMAO2LZd17H6MaGj9jdmU591U/Dl/w/Yw1GgVUseiJ+4ZVmlYBKO9VXQVw32dP7a1X40gOM/zYzyheFgzDivMPdfJxiMIeYpZ6q9hPMl1dk5C/fCmvRkxJkbmoom3tmFo5SmXlwR0PKstj6WftwVjBn4ONsVh5E+CPd93n4tL5f+vFl+HCf/R9uO0imQBx9yIDILqcsiP+3/KM/4ZTTnggX9KcsPPF173qiSjR/VEY+NmVX8pPrr12aR7u4s0zVrckCxL0XcxB93WpS3U6It8uy6dGUH2c5MXM6qw3rWKZhO6MfJjFhzFyxiKbDhpTa3+0yJmAqV4WX9d26N865z4t66+bWNGMgI6rX5FojSEdq7wyAgRzgOa4bV0NmG5hxGMWz0tn/OZMADp9BZpj70zARZfiM1//vXomQNytyACIWTYm4J8/86048fizhvcp/2v+pGmMAF9EqQ6/ZwHjOu62QMcYcHutCIJyiyIcRKiU9SIxzkYBt0QdDAgbD1452Ihe/h9UvGfvhABR9IF2qT3P9i3kUuuPy+eltx1xrvXiTwBHs9HUC9tLHDYim22rmJPvt3uWAHFMEFY30JiAOm5sAsLx2bAKwpvzRzBuYbyb50543ODbcmaDx7u8b03AeD51DNkOt+2YgE89+2VYX3sDhLg70KcAxCw333YNPnXpH+C8s1+II/Yd4z+yZV6nwzPwZYeF9/lF70l9mwLbFL/GqE9pl5j05UKufqlbcynXbyuTsvq3+YhgzbCmSP/OtmuuHVj81ML0PnGPO20mipe3J/9pBICHrh6PmNfYAR/NOkH8vsQ9qjk3YzGNT6qdcP0z9Ho/KmzeZ/l9+6kGYPxiIvdNifn1dNxcpYTmRJs/x+ByyeM3hkm+vwaUXyi0Oiq1A/B5lOMRPwMybU+1T/tOPgHHP/kxuPZtf4x0620Q4q5GBkBs5cZbrsQFl70Hj3vwN+1cuPYFQQYsfOzLfeyqbOTyCJdFq9ucIJlrJ9f1kjuVNgsXdhZrtGIULvp8gUbMr8S2khlcu40sOh0a3ifuA8fhaLyf4iUvIzwO5lqdtqeQQ7ckjUf3y3HyD/igHO845j4ufP/ywUg5J8pkytGPM+i8Am1NyONMDQCx37l+MUpTg6kKMc+82QiELKhX5svGfsac3TllvlCoM56f4wAceea9cPRDz8a1b/lDCHFXIwMgduX6my7DRVe+D4984POxsun3oywIy8yXr2Q9yCIajQALUTYD0xZaBaCLs9vGwp1nZnUFgds08xdl99n/0mDtM68WFDGDF0MeB3BfNv+WVeNBmdyYgAU8BYlIeU+IaRSP8+NRT7zFKP9QjtNo9uR3KbTrugy4cY/7jQdnuqVCe4MJ4HNgHDujcU3g41xWHGis4lFxxzo1icPdom9GwsIqSulmzcNA5xua9mnYZkwrxd/55+iH3B9HnnUGrnvneyHEXYkMgNgTV99wIa658WI84v7PpQs83MUuXtCNL8/1Wun2ACzqUz2e5bHwhYuthTYbw2AdYUpc11y9kq37YiBftm6jS77rU95gQVZIyFIrVqWMhXzNy9PwNwURT7EP/hjUGGwsLAicNe0M9ZI/oqD45h7ksGasfSbwe81IwHm/kWjWOEYH28IKT/zXt8X5WLOTz0k+qRrBr821cXvnW1wdstg/ynnnzzHnnQs76gjc8Kd/DSHuKmQAxJ657OoP4dbbbxh+QdCChNQZfRX1KEWt4NLeMO2qF3iOReLLMYJhKO0ma2LzBdvlCy9ETf9KfVCs6WXivEOvrStxvi1e4UA7NuPQBRNh23J11qv8TZ1WjO7ZI0ZJo9o240CDv8krNT2LpeMI5H6juz+5ery1c6yMxsKdB+5EajM0n6VRu3AmAG503Yye0rMtptMf51jOyiLTcU86b8hCvyAo7ipkAMR+8bmdWwGbC9c5935quejGi6oTLqrLF+loBAB/seTra7ngG+8zd20vxiC19WvsKARBSJ0xqO3A+jGGbSnU6Zazbl9LvUkByt+5XHP5TUFe7jfK1bUKwLwJcDFze2bNrQJrHlYkIcuKZW1+xTg09Qy9DGN2bnzM2xiE86lEjQ8WlvNlqh0+RdKcTy62tc8slP21XsyjtoeQC+BXg+g9tzlx/FMeM/y98b1/CyEONTIAYr/5zOV/in12BM6+95eNG3qCjP4F00sZykNibgXBvAjngv4iCkTpqRfp1mDUB//oIm2UqZGwRTEqT26bb4Ni9kQlPvDHY1S3cRddb2rNhJ48AvDy6kQq9cYuGIvmNkXWPqMcfXu02/eJCcebj12J5VZNuq3An0+cd9hicJ+UiMe1E4zK8gGjcaTgcQWJ41lyA4XusyXd2J2xnOoe/5RH4/bLrsTNf/dJCHEokQEQB8QFl/8xjlwdiwee8aUostUT7rLFOkbAXAl3sffX2VqymaXXSKR3roUq1DEeyn7XvgHxY4Z1dxXHPNN1ApbafhahNMq0I2wU3sc0BNHNeU63BBIN1tRGXpof86QccsHkc2uy6fWt1nZj6DNjYfNH2UWjsWbxK6W6n0Cg1xbGztwfL+ClZHLlqyHzx8CfTTHeVI8/QphaI+fOrxLAmxaXdKhw4jOfjFs++Vnc8vELIcShQgZAHDCfvuwPhy8Luu+pjxre1xmsgWfJvHX4f579hYelqrhU1fPb0cyy3AXW/LW0d+Gty8u8Pc7OJ5FJrejF3LKAGQkCDK0IcF70avzoHI0BvQa3B24P00f+xuWTof38LUYUP/YJTSRqJ/lxYH3ivyUj68crfy1uDTGyyBtHrRXdceAA5B64X7nRZtzz9tAf2gn+Cei6ixpOtH/YlkJuLpNyflF3mvxc+/QqlzjhaU/ETR/46PCFQUIcCmQAxJ3ik5f8Ph5w2vk49cRzhvdOUIoKWFOPr+NjWb4E1vq97bl8FWIWJHqP/E1s4/Yyc4MXh3jxdYKDesm2hCAuXqic4JJgGO+1JmqJzeJgnZUNNw7JqF+o9/OpH2PcLHAUg+pyL3nArO0pZV3b7OdHW82PGcArFubMUtNS5zaGv51vNVf6QqLSlqE9Pry/5Gdu5FyM3jEsr8w9RMmjCfdwJW0L7dvUtxhjOL+PPAInfvVTcP273zf8kqAQB5v8P3khDpiV7cO3PfOdOOv0xw3vy9egWlu2fIVr+DB2Kvv75XPZcpse8Zf9apT2a4bbfHpf6+u/Uz5lrey2WWJYziF1v3a4xo9f81v35a/8BdqvjHVfzevaTD7v3M4qudz8d/DnXxgEEH7bwH2F7Qr9PEDlVqOa+d8o8PXc1wUD4euJ/dcPD7/Gl3+voDcOKzTHuBzD1TR28auGJwcx5Jri8VrXY8U/Vwx/TEHjWs7ElT8Pcj03rohjmNrzhuL7czC5HO649np85gXfg1s+dRGEOJhoBUDcaTYXqU9e+i485D5Pw/FHn0GzV79UDMDNtHoPz5Vro8GVK/WtzsziUnmdEcJNsXiubWVbbtR8TI7VbDX3UBl1i0rnPH3OgF+lKD0v7+kjfptXiftt1HfKJbQ/2nnzGYfZvH/Fva1jUZ5jIDV041YyTc1ElzSxHCxeOclB3G0Ud8B8bjw79/Vr//jTDGHEajxDPc4JzcN/HBtTmXIO5jHJZfmBQ8rS5V76BcSPgvJ5WOK79+H4HX0UTnzml+K6d/y5fjdAHFSG0xlCHAROPPZMfOsz3j48F5CZ+4U/96M/4BWAzow/1wg6UFcAUls+zvqbmWyN47cn97e7P7bJWhpn5kDzIzQ8w8ux6ooEzapL/DgTNdcf90uFK55ptj9ANMaYcrO6OpH70fwy4YpXKVDyaH/0J8ehVQaM+fgf08m/FJiaFQtepXDjRzP0NY2bm0HnVZRpu1+RiDN2+BWSKU/weMMfH5Q8+Nj48XVjHmf85RcF135704/aV/BKyM7/3XbxZbjghf8St196JYQ4GGgFQBw0br39enz04rfh4fd7Do456uRhW3zIL78oMzsrm9xsKj6Zn7dzIH54zK0gGM363Htz9VgQjP6WbOO92RyntNn2q5aIr7mfXjVKnGnabZ0o3bm70ZiV2bZ1HqqruQ8T5ml23hmGmmGqDfD2MU/4/OMNeNRxH2OZm2Xww4p+tl97W3rgkgvj7XaZ29JbUWrON1q+6P3mwkBZLTC/ImKUK68WTLVTc19/WuHp3O/vnZfu/J12rk46Hid8xeNx3bveh/V1WgkQd57hXIUQB5F7nfhQfNszfg/HHH3quKFc6finVP2J110RMFejnc3Pbfda0MY2v2Lg793XOMN+m7Jz9ae/q9TEjDNu9xo0m0VndmpxBml+xYDanHtWoPecwYa1m7H3Zsdxth1WEOLzA9auBKxpn38uAfQsArfN4xt/kjjkmo8BPU/Q3Fuf7s2Xbycs9euqjlv5sRjLj1tcjSpjAuon2mNv03jH89L1G8mfr+WY774ScPMHP4HPfNO/lgkQdxqtAIiDzo23fgEf//w78OhzvgFH7jum7jA/9zVgy73/UqVWz/+FJ8dreUP8+NUYw1xga2azsT2rxScl4fyM45T65vs37a8zuZCz1Zw5zvA+Ac2qCefm+m2u/0blXF16Z1Mb7Vj4wS7PBYQINimZTUnVEn4lgFfSSz9LfYSMuGSbt5vgcxmrqlu/gTC5Cu0xiP2koHwMUzw5qC61W9qnsnUlwDdiLv/6r5WY8OcJnzfTysmR9zkNxz76Ybj2d9+z4zTWEOJAkQEQh4QbbrkSF1/1V3jkA74O+1ZHuYv9cHm0KMJVbBqBdA+yTVHKdKut4wSQL7xR7Usu/K5JoLlYs2iw2Rjbpn44MQj5898iXhyDy4b3Zl4kjIXEqMa8CRjvBaDTP3PDU6JF02XcSvw3uS8fohTpveXD59pqRDEBZqE3LpY1tyT42G9epdKAVVOyi9kpcY3OI6pbb2uY//hpgju/2Dahey622/ncoY5Qvjsm4IH3xZH3O2N4MFCIA0UGQBwyNr8geNV1F+yYgOeNG7yOBeG3Rszy2/rauCSFM3+hBl9Ms4HgRsM21HI1o7q9XH+juA/CDbDgNP1yOuMKeD+SRchqX6OQOQ1IrvdAHBcSVL8AQvWsjdF7V8uHrZZ8jeTHqu4L5oAyrvkaerbF+IWhfDoh1RTGuhZGYTAOqTWPVs+gMoRlNSS0iXp2pmYw/BtnZBLC+cDjAtdn17kQ3PtVCzkajvmSB8OOORo3/MkHIMSBIAMgDilXXPtRXHfjJXj4/Z6NKrR9gR/eg8WvXgHdJdIZB7qOogp2jVUbiiIaVw+KCFObIGH2bU0XehZW9yAZ54SZ1YBgOiZVamQh1WTaZXXfXk9cLQX18RnAC7T5calDBYSy9auQzZUZxyY17XT/JnP5N6+M+uqnxXV/ovwsloU/rtwnvmmfaDyiMBvqjN+F9WeU0bnCbeeyCPUHM2R8zvK4G9o/5s/Lnf+OO/+RsCP24YY/+xsIsb/IAIhDziVX/83w6PmD7v3l08VrEku+mFrn8kfbWIRr+VwymIpSPooLAIuxquDVInHm74XBEIyG+9sxAVZzBOXYf13/OlHr3nNv2yvbkmsMc5Jv1mkX9Sl23xboyfmwvRyn2kZ58t2VQed9PE5eWptxMzjjlJvq9ilN/+Rxo3F0LbuTpG7ic4TbLw2E87a8d+dX7kd7TCzUcc0Znwc+3ti38Zwcf0ZYvyAo9h8ZAHGX8Jkr/nTHA6yrCdhg7bwsrg4gzrLdcr4XDXfRNhIH9K7v5tobxQEhNotEzimYi7icHwTAYqvm0q258UzQnPT4+J3crNMS9xHUTtmSzBmWUja1jbo4Trj8+LjSxm2a25+rGrfRmDV3M70OifljV9ow39N2JSCBx789B61rNFxU31G/j3eEc8DvsiaeuZOcjxKfZ6E1Pn82JuDJj8b6pptx0/s/DCH2igyAuMvYmIB9qyNx9hlfBpY4M+sIJV1Svf4gX6xZp9oL8JZt5VrbClvebXF70AMnXl5CSaVdBvClx/rlup9agWT55MxKeEQxpFLWyzGkx5/J5Lh0T7z9VoIagCOai5TftCX8iNSWU6eMxbqJ86ulhlfJHx93jlhYkbB4vOZNQDk36VkD/v4A/jssbA1le8cJzXmXYH4s2QTC6ncTRJOJGpj/N3DClz8et150KW75yKchxF6QARB3KZ++/I9w0rFn4qxTHzu8jxfhRnjR2z4jylSHd5SHB80LZK0Dd7Gmpui1kZBM28KX5bQP7qF78W6FrjY8io25Mm6VgeMY5Vb2hxUSunFtFtoJ+TohCg/GAT2R79Tt9NJ8afdvGch4e4XbTfUg+Y/mW9N2zq0++c/5Ul0Wz1oU1SC4FGr9bASG1yFIopzo2MTVm7H9cDC5rdC+0cGeMwHDMwo7L078yifi1k9cqN8NEHtCBkDc5Xzs82/HmSc/Gmec9NDhvYEkw0gCjMXCqFzeF0R9im9UmcvXffU1G4YifnlrqOPaRdHPkndtJgg4/Vs3cnmugXDLI28zyptfu8ixJS9sCMJCbXPAaAK6eVJneFya2Obb6JsAc4LW5jRtyZ+4cMfDfN6hfbjjG48Dl/LHzMej48v99gPR5F4Nl7nzrj0XDVXIEYwc5dzk4BodVwyO3IcTn/VUXP8H/xO3X/4FCLENGQBxt/CJS9+JB937qTj5uPu57Xxx9rPgIDDuumsdoepv7wphVTASN3+x9TP4vKFjVGxGWPMWC/mVvsGJThTO+trokwDcWxIxa1sfXqcqSs2zC6F0jjP/ZT7gg9UdX6NcuZTVUWyPabJGSGt7Vsq4bKelebicXHrlb2y1NUt8zvmvMC55pRCvWU7wfayFaavV3KnSiHsOgyLwrQ+333xT+wwnPecrcP27/wJ3XHUNhJhj+J8ThLgbOObIk/GdX/UenHr8Oe4rgjfEz12Xr8cN/27K168E9qcyf2zLfR1wrGPcThs3q2f8IaHmR19yWUvh61zpq3Dz+/hVsp2Yrh2KkV8nV39Ua97GXzFbY0z5rXzbrt4q5E0/f1u+urf5QaFpvyvrv163/Vrh2jZ/xXDu85hL/Lpc6lvMy/hreWmsuuPs+83HJFHOzTHKY7LZxj8jbP7cAeVVj1vy50Lv/IhfGww/jvV4Wj3PUMe1HuuE2y65Ahd846tw2+cugxA9ZADE3coJx9wH3/H0dwwmoFxao6AS5eJbLp6pzJiqqJfaTYzerxPmCz62vqftQGMG0FzUgwlAFBi0IsnbeyYArRA1JgDhu+yjoOW+kID2TACLao7ZLbeqeZihLWdVkMp40Pb2NwDq+HoRD4K8So1Q19jAGlUshxwbMd1iGsJ45V8BbMxCpz88/t2yG1brKXdD+7sUCbxs4oxaPsNXdI5b7/ysOdz6uUvxmX/8fTIBost4xRDibmTz88Hf+g/etvP3AcP7BD+TakQ8zrrzVie2Ya/5Nt3MbIpfLIN1hB1oDEK3PfMGwpkSFtMcz+WR2h8LQpg9x7aCqYgi5Mu2Alh/BpfaQSv2vVl7XSGANywWVhwGwRq/sz6twljmnwsu+dVxGoR8TyagzasaDuqva9uP3yDGSB2jlEreAL+nyyb1e8N65c/f3kpAb6bfMwE2xPNtl+MRfp64xqm/D7DJ89Yd8f/Uc16O9TXXQQhGBkAcFmxMwEuf8Yc47ujTh/flpLS+iHdNwlS+viZRhxce3peabbTdwnsu15iA3kXdtx2NR7PMzHEt9MuA7opCmI3yjLs1AakxE1VIojkJbQYT4FYhyGAY93MV82nLNwIOOHFzJoBm/psNiVcYnAEA/CpMKiagHM8VH4M0YwLiGNBxWvWPpYsRTYCNH6zkXzkcXlh7m4bP5bhagXDsWxPAKwEJt1xwMT79vO/C+lr9gqCoyACIw4bTdm4DfMfT37lzW+De/qQsF8og4vBiX/YP75OLUYQFvVk/2ovttG22Pre3CiLP8SzE75gARNEFEJfDSwxX1ueTGtGPwtreHgC1lTpxvACmVshWnXatNRvRBNQ4Uw6rOrOOJiBtiZv7yLc0/EoAmRSEVYI4Pq58OD6NyQomILSbnADH40z5xNWTphydg6t43iR4w4BwDqd6Du3UvfGvPzrcDkg33wIhNuhTAOKw4abbrh6+J+BRD3iB/xnhDeFjc3mbhW3tx7RQ69mwtbzm7bmugV/XQq4+XajH66y59qZ37sLPueWezObtKnK+3c8VNO8olE+BP+KI+t32Fmr67+enp/r5kw9TxY2+JLOmb7Evoz7xQFBJA/j3Ctqc4Q7y3JP7+RjMjZHxeJa61NaGlL/6aMX2shxPC++R6LV1e+4acB/xMx5XdM6H3rkaGoIf8+YjklTuyDNPx1Fnn4Xr/+j9SLfdDiFkAMRhxXU3X4YrrvsEHv2Arwd/QyCLapEPc3sK0zV23O4+6+1FpRUtf5HP4uLatRALfJ215uOJUfR8HXMX6dgu4IWgtkF5WhgXiyLnpYjHiWVqtv2wj6XUjX0U9VC+9tGAznc3cJslXGi3mBaEI25+hGChn+HYudLWSLVLwGhHNiklp2TtxyjD+eNa4z7x5/w5jsUU/EDUFX9zyXXLIvR3p52jH34OjjjtJFz3rr+AEDIA4rDjyh0DcP3Nl+Pvnfm19eI97WsEGdM/yYv9sLlzMa4vrSnT3R4v4gDijwVVIa4lOagXJ/+ZdSc91hdEa3b6fXG/ywMIs0Iaw7Lf2rjUqRrP2vhWXyeLpfJX/Pby4DZDv6aliUZc0TMBFsafM+TA3K+wl8+BYmTGny226ZMVtZy5seHzjke1ZMZGggajHUNsNQFNuXx+0I5e2V7QYx51LlYnHIcbdlYCxLKRARCHJRd/8QO4+bbr8ND7PKNudBfG/syt/f13EhC/GV7UqQhfVKmeFxS/w4kQGQQ02+fyJ1MR6nn5i2JVOoP83fF1Mu7jx7RLVV6eR9COVNsFWHx8zmP7WSp9tEH3EneM8ogrFuD84VZX2gHN+Rvda++sTiTXYGMsmmNT/k21j6DmB9GvpmC4DWDNyUX9MffXhXMrAZRTGIMo7PV8M3+srca05qCl0tZxT/gS3PzhC3CrvjJ40cgAiMOWi77wP4eL4oPv/RXD+6Br47YiILzsHa7B5QIaLoyoF+ESny62zdcMW9lD5asiGrVdosTZvvVm39YInXVyK+WDkfDiQLGnfxNYGHg/DUTZYvQqJ5VqvORn3CVCshCx9qGI//igvS9jbrSqgUiuYG3f6ryfHwDNJsDCMeKcnKgijpL5PpV/Us2TlzPgz7cxPo+db4f3uTo5/5ygP2UoNtXO2xLXhYcSsN57bJ4JuBeu/n9/D2K5yACIw5oLrvwTrGwfHnTGU1Ev1r2L47jBuJQTYzTL2u4iHe9hh4s6X2CjyNS41uYWYrAs8eqsNfmaFwZ0lpcpn9j32t+JRPm7toJYGW3hB9xgvny8bUAqy3v4kxC5n90fu+Ecku8XYME41HYTDTSvBFhowPwBce3WnqFUNrdqEEyAD10pgjzWCQs0tV34c8rcETW3olB+ERDhPOcQFlZicrTuSkD9e+QZp+GKn/t/IJbLCkIc5vz+h16L933qTXSZzhfHqUD+tBN9Pm74l2alWVjGv9bMWI2nk5vtHBvjjLR8HJ1Wf7l9I7XjT5GN+618zqtuNy94yffL1tb0rb6e6nPbXD8Z5cXbKR/AL/Fvtq99HYTxLT1Y5z7VeKUvYaw2/61yTpvvqFlPYzr1Z9NPow/B5+M1xFzXMr3cuU8bVlQu51HHd/gSvul7cvzY5jGjdQsaVwyfDuBzoZijNZ9rPCbBLORjUeLS/nCulPEt5oPLTVu57hrUttW2E/yYhvc1iFgqMgDiHsFb/vp78Tef/U2Wf1QZQd0SrmlVGEnkygUQoEuvF+1gAgBnJUjgJnNAgmJBQPi7W4owr1EFjduIJiCR+QgmwBkbFlkWmen1il4Pba1R4haxBOVEIpWFZfy7M7Md/uN9FGNNYhoFk8czGwEW4CzM6yjctT9lTNehb0HoAX98nBjmtsKY1L/mjUwRVW8Cin4O+SZEQ5THzB1rlwePHep5BCqTj+/aXH6WVmCTZuH8qedbjVXZvF/h5o98BmLZ6BaAuIeQ8IlL34VjjjwR9z/tfBLqHdyy83Thd0vU9RUvJfN9d17GtmlfMRi0xFrMB9+bz/W4zVI/toUay8gsmM+z9Ilj5zLmrIjLHbS95hfzwuzyt8Hm41Dp/taQp5MzfmWhrrlx8e3nwOjk1uYQY+aQm/9GLeT24MoML9P0ngbKt5UQxykfqPxgYBzb3v0L90yATxfd8Q1fflRvj4Q/nXFqz5nxxWU/9su4+WMXQCwXGQBxj+GOdBs+fuk7cc2NF+HMk8/DsUed4uWjc5G1eLFncc1vy8tgBJrrtrny8V5ybRO1TatL3Vy2vUhb2E+lOmIdH/4z6lcUAhaAcZw6dZv3MQ8viGOeCc19bVRRi3W5j4n/AuVb8Or4T2UTdQgJXhjzJL6XA3jgSh6J+mguX+o/mwAD/HGw0m9nAiiDoR2rMYzzoPPHHesU0qXs+Nx254M/Odz+uU8c5D+X/cyv4qpf/W8Qy2Y6m4W453He/Z+PR97veTj9hAfj9BPPRfz2Nn8bu789K7Nb7S/iRv/jcK+Tj2OhBaN2OL5NpcznUWd2/BW8uU74bYNczjhP+vrczT/8E7pZjJD81+nm2ENMczHrV9OGXGkbfzVujlv7kyiO1TgWflCIx8ioDbRtxX1jrGn/io9F/rrk3r5pHFYxTuj3MIbtMcxjVHMe1Xyd1/DdTyxbPXY8dog/aETHBsnnan5fHPdyTgxxynp/+1XHU907br4JN33ok7jiTb+J6//sAxBCBkAIIYRYIHoIUAghhFggMgBCCCHEApEBEEIIIRaIDIAQQgixQGQAhBBCiAUiAyCEEEIsEBkAIYQQYoHIAAghhBALRAZACCGEWCAyAEIIIcQCkQEQQgghFogMgBBCCLFAZACEEEKIBSIDIIQQQiwQGQAhhBBigcgACCGEEAtEBkAIIYRYIDIAQgghxAKRARBCCCEWiAyAEEIIsUBkAIQQQogFIgMghBBCLBAZACGEEGKByAAIIYQQC0QGQAghhFggMgBCCCHEApEBEEIIIRaIDIAQQgixQI6AEPdQjj3yFDzmzK/HvY57ME44+gzArFsu9TbauCfNbG/qmd+S9tJOrw2rpefz2tk7Uy65GLlscvVdeYrj9hnHSjVmUyaFOKAcO+1yn2PMXN5qvFLOap1E+aTYVqmbQk703uqYDdsslDGfXy3DMbbkTnm588XgcojtJxfTj3nsIx+HFNpG8z70m+NaPZvXt92K6z/yYVzzl+/HLZdcCiE2p0iCEPcgTj7mfvjGR/0Mzj39H+DoI09o9nvBTdvF2ubEvpXoFC72bbx2n7tgY14kE9ptfPH2wtMTgORfNwIa+mpVWKIR4DqpbEt9wekJ8lQ+ts1inuNtTBu34QR/ErB1zm2FIp5pNf01+PycmPN+LuPLJjIGbpwtxC99Nh8rj8mQa817w3pF+0veqKbHwrHhPpT9KYxrGsaNDUFaIRx3n8fY7nrYf8sVl+PT/+b1O0bgLyGWjQyAuEfx1LNfguc98sdx5OqYss3Npgg/E+6f5izQu5kAL/pe7INVaA1C1wT43BNo24YVx02zs0Luh5/ZBkPCgp7fOxPgZ63d2Tm3EUXLtdmaCTQCnwXO6pjNmIAUTEhapW4+6yKe0WhkYU9BeDm3Ts6r1IyVNw1kyoay1orvINBp3JBz5JjWGx9UQ7KrCfAxYn5u/Keyt11/PT78ku/EjZ/+NMRy2bfz32sgxD2Ar3noD+L5X/IGrMzfubLp/3omoJQxuhq6ukC+dWCdnSU26jW91pn2dJqOdyPMxfTxYx0jVbey3dq41gY3C7GNY9A4hLaMOmJ5N8fN5Tr3Apq+hbZrc9bsL/XNQCM65WGupRTGifPv5ZN12bWD9lhbiFT67up1cqbyOVfrVbaQVbKyPY9sohz65049Ni4+tc2V/bjksajnx+roo3DkGffCVb//LojloocAxT2CLz/7pXj2w149imJ/wh/EKZQp9axTr9Z1l9Y0E8u9t3Ei7CZ9VtrjGjZtL/VLPS/4tbRRGR932Jt8vXKRR83dEsVIcO0bavs21bM8Nc7tpBBr+lvbqPHzey6Xx7eQrL5PNT9LiWLRmHL+PB5cBjWmUe7jWOz833rn9Zr7baWNMt6l3dh3c8fLaIpuoPHJZcOxcLmCckj1XHDHhpdTEI/dzupCqvmOMVIdg83SwrrGBB07Wjoq43XSYx4NsWxkAMRhz5ec8bV44SN/Ck6GU7+sJXNGwM+VUC+WM3Wbeqlu6RkKt4/FHVX8/GwxmADKqb7ulE8kXkHwWmMRt5k3M8HwRJEwFnbOE6luW3sTEMUwCrgFkTO3LwtygjNUrk/wBq4xAVQ+iLLx8XHHDYNgWhDZQWgRTEDyeZQc4Ou710AwAeZyXK3J8ACNMarHgduPx7KagHIkgumL45jH5MiTToFYNjIA4rDmwaf+fXzH+W/eWfbPp2qV9LmVgHGfl/4o3tiDCfDlZ+qEmV2I1pQpUeiibLx9Kj9nAtzW1M+F5o8u9+FfJ2RB2DoGy5yIeGOBRtTNm6KEeXNTZuA1rzFOoj57gRxmt5S3NwFG4lxzsZibq7cq/bFuf4MJKKanrgJEQ+BXL1IwATRm0yDWuh0TEN+n6YJdDNPYV0wmwBsUK6YD1O+aJ3DTBZ+BWDYyAOKw5cwTH4mXPul3sVrtG953xT6hFcIJC7UaE5AvurFe6tSZMQFkR5BFr/wXt7t6cSYXom8xAZydm2nnPFn4KFa8ZcDibNz3RLNNtDP4LExuiT/V+qvy3udX69Wx8TNU67RTTQBifWc+KHcek1lxDmO1ib3mPNrbAc1Y5ry4z2Ub5wVnPGp/khfp9VQ+L+OvgymYbmVEU1DM0roajmIOcn/ydlQu/e3fhlg2MgDisOS0Y8/Gy570Vhx9hP+Yn5X/vGx3VwNoNhTr1zLRJuR4hmaWTsLWb6fuY7Eo29O8qIPiF1vi4gYTkFi0KWcXH+g+E8C5OfFGawpSzb0xBhSP22DhdyZgHQxDqrGy8MUZazneKe4zP3uPJgC1v0NcFsFmDM2PwRroLvuTuFvHYJSL6bTPGRl37KwxUPMrAebNG41HPQZbTIAbr1TyufHjn8Tlb30rxLKRARCHHRvxf+WTfx8nH32Wn0EFmvl76sezbl1izgTAggDDzZytYwQ4ujVtjQ9xOfFmsQeJHTrtgoSE8gBl4p4JSGEOOGMC3Gw3b+8Ie8zN4v3tXDYIoBuBKHos/NRHt5ISlvzdLD+YgG6ZxHkhiKN5AQ11Uh4btLHc8Zjqrly+3E5Cc4ulxElwpink70wA5Vf6TMcy3w4AcvvBJO2M9S0Xfx4f+t7vwfrmmyGWjQyAOKzI4n/aseeApc9myse9NlO2PN3e1J1Ic+2Yn+mhFUXXdjABzUy220KH5M0B0jYTAMSn610crh/LRDOR5kxAaJMFMPSTjdDcLYphbwrHL8yapwlrMRGt8UCnr+bEdXqcr5MDrTqsQ78pFq9aWGijudVQxijVduLYFqMVhLn3AGQwAdz3xtCA/q5zvHwMap2bL70UH3zlK3DbF78AIWQAxGHDKcfcDy85/82T+DP1Iuwu+H4volhar1zHBJQtad5s5PvCPlbZ48uyAJbYIBE3L9gcP/n4PYNTIqc2Lt8OYHE2yifPqt1svJTrmAA3u+Q20BX3WjeWo9yaWbWhXco3evAv16P+o8arZajvRZRTyd0tsYe+WCPMk4FINq0ExHHx412NBR3b/OBg+bRB8iagycW6uRVDgp4BgTuv3UpAiWm45ZJL8HevfBluufQSCLFBBkAcFhy97wS85Alvxv1OfNRMCZo/d4xAFXIyAkDXBMR75a5conZ6pM77hK4JYNHl8nypbpf7fe5RmLi+uw0xZzq43SAUUby9CbBZU5D753JJ3sQ4oYyiFgStxIOReI0XpxUfc8CZHn7Irnn+YW3gWffwRH63LBsFHmsj05FgoUzzl8aEzQh4LAGXUzY3PTHnJXsf2/z4u/YM8RkFm0zALZdfhg/9wKt2VgAk/qIiAyDudjYXxY34P+Ckx03vdytdSc1eejVjAoZtyWBztwR4JtdrPTmrUeo4Qc5xaq1QFi5PJ0m9HzXKYlJrNe3UGeouKwHJm4TGEKX2b5mtTvVZfEpu1GZcCbC4TA00Yhlnwk7oaQy6M98oxDH/oVxy793MmgSeV0xSLLvuGyhvYGrOWYCd+aEx7T1fUIxjMBa+X8EMp2A6UMfn9huux99+33fhxs/oa3+FRwZA3O288BE/iYed/rTxDV0E542AOXFp99KrLSZg2J4Ms8I6s81CPSdoNbspPpx4RxPQNQVBlM39jSJFxiMKiIsdTADiyoS5nOqMHq3Q5PIwJ95G4x1zzG00BqVTp4wb0BiDOrMN++LYlHLVAA2rAms4o2KxzUSrGFP+qRiP/AVBNmMgQp/XRjnC5ZbprV7QXjcmYx+qwUJ3JSvsu2OND7/6+3HTZy+EEBEZAHG38sJH/ASeds4r0cypSbj7l0drhNfvpVe7xLKO4NbYdQm3m0e8ZUDCxrNmmzEBKLWtEczeMwfG5Tuxokh3xygK56zIA4gz+1gevm69XTAzM+fcSEBL37J4kYj55fTcB78vfrSuth3FMsyc89a10bjAi/umxmQcVrz6MRmg8et383cBGPwDmeZWGLxxafPstY+OUeH9q/x++p6AFY3Tx3/2x3H1B/Srf6KPDIC423juQ1+Np5/zPeV9V4K3ijdJYUJnL71KPlaP2VsCQ3xrtsXVBye2vXyKCfAiVev2TYB/Gh9TmQSetY/7rRXexPfZgziWWkBvSbpm628pwJkPg59BkwlgAxNMhHGO6BsKt8SPPPuFMxFsWuL7Gqe9beBukaTaz5hLXQkwF8+1W8obrNOGG4PkVymwZqNIJmDt68XVCrhjHc6b6fXHfupHcclb3wwh5pABEHcLz37oD+FZ5/5Qs70num6mNlNjmwlw0k3i0DUCc6JO+yzGJ2GP5d09eLDgde6F54ipzc0QDEiy5oJf2/BWapsJAJsEmrXmXF2+QejLa+Sl9hkTEMVy7VcJ2Ki42wmwVkzDEn0pyceVBZ/HKHUEOuTIT+jbmuvCi33yfUenvbaNcAskl4/L+onOq8bkhHz4nKRtF/zaL+OS//E7EGIbMgDiLudrHvyv8ZxzXz2733rv7oQJCCU62/m9bVkJsK4J8PnZvLnIJcqFuy07J+qx/zxr31o+wYsOWoPgTAKV77bdixHFqGcCgCDKwSBwmym2BTSrHUUYE9zqjDM7AM/g65hbI9DdWxKJnhlInTFMCCsLtYx1xLqIPdCagJJnHXN36wNtbIvtTn2+4Nd/GZ/Z+U+I3ZABEHcpTzzrm/C8h702LGe23BkTYFtMgIWVgH4s7G4CEvorAakfsVkJQKcsCyfMiVmJEfJqZrklPgtrHZ1GwPk4pGAmwmzUP/GO6b45iS9oOb0xAah1WdgasZ96v/Z5Wkco/Ww/CrLvnzMBc0IbTQDgzVai9hD6xmZibc5YebE3/6NCZBSQvGHK+BUSC/W8ibnwv/7ajgH4JQixF2QAxF3GI05/Jv7Fo3+1vLddyhsQJbMRbuvWsF0Mhvl42GICuqYjCzQ6Kwj1FYtHZ6szAS7OjKj7GFwm3PsHmR0SGINvq/9JgxCHxiDHZHPB/aui7vtXzQEZCCec5oS11A8mIPczznrH9pObuYPFmk2A22ddEbbOewtGKd4SMN5Or0t+KZwLaxpPMiGuD2sLYwV/vEK7l7zrv+OT/+FnIMRekQEQdwkPOPGx+NbH/hc0sp12r2udV31h9rX44tuPR7HSljizbc2YgNJmFGqOEfZFE8Alks+hFXXfXms4apkoVO7JfhZKF8ec2G1YwZpZfuk7+gLF7VXD0fbJ9b53H97NqicBHT6f3zEBfPxcDO5nFGsrKwbFJMDHyJarecAQ7W2F0uN1FXqwOQPc+BmfV3ws3SqHuf2ff9db8ZFf+FEIsT/IAIhDzunHPRgvO/+tOO7IU2lrFQLbowmIkrlnExDKwrcOhFlvt9z+moDS5h5MAIsH/IWf41pP2Kltf78YflbPIugjdFYCrInbLHNzf3omIFkQsjDDZ8EvKwNeTEte6yrGFsaF34+vqwno5eb6S21n4c6/mDdsX6N01nqz/pIP9W0NL87BHABhjDiH3Bf3DYG+XTYzuf61n/gwPvzzr8X6llsgxP4gAyAOKacfew6+54nvxElH37ez118Q92oE9t8E8AXfl7dObZuLwhfiWINnlBwnmAAWhn5fwvvUmgXOiYtnEbROX8oocMx4Pxt13yia1szIuV8WDFapQ+1wzDhGxqJWluOtXW5HiJX7sK7Goa4M1MKzX9YDBKMBL7glP4P/2F68PeDzd8efRN+aMTdfDz6HqRbFN9dHXq248dLP4a9+5LuQbr8NQuwvMgDikDGI/5PeNfydJ0hpEOm5Gq7eriYgi1Vb3tcx9GbeTclgBOK+eRNgMxGpR1FYXcyOCeD74q68BQMBxKXsmGP8DoBxHwvgVDoFE8CiTPlaE9OLKffFKJfmY3zNe/iZMCiv3vMEiU2GF1649ji/VPIzMiHtcwU8puZWS6r4T3/XYaxzjmtD93kFVEPTmKKN+F/8Gfzla16K2679IoQ4EGQAxCHhtGMe4MS/L39MxwjsUtrV64pyr94eTUDqx2nEuRelYwL8zB3Yy0qAG5HkjU80CHkDx+7eJoCfgeZZO4thW4dynzEBcP3xI9SIffgb2yuZhuMQhZuFNM+K3bjSDNrl1ty3J5F3op3IFJhrs1k14POP9tUH+aKJqQajjkHHBJRnENL4DX9TDjdd/nn85WtfPvwV4kCRARAHnWOPOAWveMLbcfox5zT7bNfa5i/4e8YL+zbDsScT0MpyG6HbVt8EYC62oWsC4j3jJmayIMwdYzJjAvL7udjNRwSTtz3OBARjU2I1om+Upzlx49m8e9ANLKYULyy3xwf/xlxaU1gNyxQvtDXEXVNPJhMQzULPBJS405ccrajtYiqoP8WIJd8n32cA9GNCmHK56YpL8Bev+Y6dvxJ/ceeQARAHlWOPOBnf/pj/gvue8PBxg7sQ7hUSyS31W5FvhX2bCahLrDPly5Pk8xGiAFjII97ztuRbagW0Fdr2XjtcfJevi9V/l6M2KxCci1sloL6wOOWa00N6uXzNrb8S4AwCxa79qwKc31kQ89aAWCPM/vaEId5asCKsaGbwHNfQMSsg05XqeObcNsXKxXXS8PhwYuljMCF+XGz4/YF8Ltx67TV432tfKvEXBwUZAHFQ+eZH/ns84l5f1e7ozcZ2JQjAllKxTm5rN++xqwnIS8az9ee2zfcympp8sa8mwpsAc3FjG2hEyQl7QjNjt5l280yVDYb/a23OVDbO+nM+8f61r5OPgV8JKG1Mddy4pNhGOD8S98tQl/ET+D5/7Ye5mXhZ9ShxjOKG/qzp/j7fjnCv+ZMJ/vaDPwb0LMLam77BRNx+O/7yx16OGy+9EEIcDGQAxEFjI/5PuO8/xFaJjxffPTFd/vdsAqYtRTh2i76bCcAWE2DorSa4dtOcgamlLP8TZte5vrMGQbTj2AylrLYA3wrc0jSLai6TKA58nN7H+7h9/4R7ojpV8Iz76ISwjeNMCIsxxymCSqsAtL+8hgVx5n6EPFDLR+PED/sZjyPl6pf1q/j7v2hMSs21HY/3//SrcPWn/w5CHCxkAMRB4bkPeTW+/P7fHrbuLr97NwFTaZ59tXtbehfwbt2uhfBb92Io0lwUa2bf0RS0s/0gdm4fSLQBoF2eduWTjxkNSozXE2LfrrnYrg7n4IwCfO+cOAYTwMfNifcUq3w3gO8jf6cA59KOD5wJKDm5J/VzPXP5lBadOUnTMTWwsSkfbcRUJtxysND3/ImAGncs8zf/4Udw2fv/EEIcTGQAxJ1mI/7PPffVw+u+OHa2kpDvbhM4El0cu/tjLL9lW1vuo1khQoEv6J3ctq4EdPK21LQQ2rVO2ZlnAoDdbwfkmG78OzNS9Gfj3aX24TWLVjtLLwIXYubesJGoM2wvvlmM/b378R65NwuAXxFAYyrgZvfxNoUfuzozN/hbAOZWDUrZ+FO+4HGtxsAZjeTPhRUZjQ//5s/gs+/+LQhxsJEBEHeKZ579L4v4Z/oiOyO7adcSnUhBMLplOlv20BbPKkNtz5bVgPlbClUAWtE2X4qFk/f1+pza+C6X8rqtb51y7hZBNAFgUQ/tOVEzv5qQavs1JprVByeYTpDRHr+4HyTUeX8Yxxo7oTVS1ghy7Jtb2p9e+9WLvJJgXUPhzEfnu/457sYEfOzNv4BP/vc3QohDgQyAOGCe/sDvwjc8/Cdm9+/ZBOxXiVqShbJforPFzSi3xN6TCZjZjt1NwLaZu4uZ2vhFRDAX32ZNQK5vnTw452a5fCi7fyagLT+KrpvRA15843tuI+/jZf6OKfAmw2aX3fNH7Eobaz8u7eqB+b4ntOKe0F3Ct1iPR53PRxqDj//ur+Bjv/MLEOJQIQMgDogvPeub8Q8f8dPYfzpy2RG/vRkBmoXv2QTQvrRt/7wJcHPq5l5zyC6YjWgCYj6IM/apXGylmoAgNoht5fLmDUui2qmTc8hn8+9wscjiZj5OLR/aCPf+4/J7/tx8//h5wXUGIXVMQTAfOZ805c2rAwbr3BaAm9WjcwvBmaEhn0T58KpHuH1R+m0dczHdPMq3DnbG5GO/+0v48G/rl/3EoUUGQOw3Dzzp8fiWR/7KnsoaeoK+uwmYKYW5Um41IPVKzGxJ6Ap9Lje/j9jNBEzt1G35X/PLzEBzO6CUnzUBbbul3BaDU4WflrY55+Tb8AJsfozjGLllcfgl/0Ewx5WAmr+f0bt6oUxjAuLzGHxrJoXxXZufsfPxTVm04VdIEPs6PYdQ+mlkApI//6it2v+aV1N2U2bHBHz+A+/CR37nZyHEoUYGQOwX9z/xMXj549+KI1ZHY3/pyJpnT+I9F3n/SqSYzS4moLdEH4VnTnCLJDUmoP/e5sahYwJYxOv7vgkwWJiR1/r5XwvtjfnUPRZMQDF4KewP//pbBIbyXfu5X2VWbFUgLQg/L63nv2GmjpAbOD7iOE65reGW+YsJoE8I+OcBMGMCDP4rf8nY8C/81ZbLmOW2r/jE+/G+X/xeCHFXIAMg9sx9jnsYXvrYN+Oko+7TFeu9stUEAAdsApwop16J/mveZjOx9xIzCu58Od5m3XpFXLbWy+I7vur3vRM7iHcRq2AeGlNCr9lgeKMAv1IQ8rGQ17aVjUY0nVGgeJR/e1++rnD4B/jMtT35DWdueFUAoV2Xa46LFNoA4scRG3NBY3T1RR/Fe3/+u5DWd0CIuwIZALEnNj/q812b7/ePv+x3gEZgTyagKxx7i9qLkUvYXJ0wQ4s1i9huNSjW2UYRZuvO7TMfM8V9lDviU+0+9my/S3lrzIMTvGgCUhunnaVb+etvBbhsaWWhxjGOGU0FSNBde2jqxbwRzQKVTZ32x3Egc9OIO4t5awJ4ZQHcR9RVhBuv+jz+/BdegdtuvAZC3FXIAIhdOf2YB+Jfnv9u3Gvbz/oegBHwJmB3I7CllItqiPeFe6W2mJAtJqBTut0Wl6RDdlHsvdCgnXnHss6oWBuj5BHsA4sjEMwE/Ew75jBFjrcQjPIGxan7ws2WKIL8PAE/OAc/+3arFskLMn9vAFh0EeqSAWlEuvSvVy7kytvLsTAyBYn6A2cQmmcqBvG/GO/5t/8UN35B3+8v7lpkAMRWTjjydHz3E97hftb30LFXid9rLCIKwx7Kz5sAmxH39l3XLNAstEvyI9HMfEO58m+qJRrBbTIjYXIxLZiAth/ufn+q/XEzexI4c6sALOQUL7VjEPN1fXYmCEWUx7bDqgDlDB4jWkGwIOR1Ro9iLhpzhmA6yASUBwLZeDmzMv53w5UX4w9/+p/jxi9eAiHuamQAxCwr24dXPuH3cO/jH+a2bxXghP2iL/nWj7vfsW1Xs7DrSsCWNq2zv4k3YyRs9n0UKtrKD+PNxJozAXUVwIK4WjeHxszMCTTNlt1frpNFEf19uZ4zBKiv3cN01B/3EF0nL4ux6GE/9wzBOsz8S8xUv9CHTEGZ/a8pXzYgpZeJVgusMQE3X3sV3vNzL96Z+V8MIe4OZADELK98/NuHj/z16As3cQBGYLctHNv2ksMUx+YMhSvVvipbUj/u9lb9K5vJDG4Jmuu05qEbk2eunZWAQpozCkDvOwLqbLa25mfA7as4y44zd54JW9M/a02AMxAhbxbl4b35lQXu07qKMufDbSQ2XpvthrKcXw2L+VsHQ2zfPmh2X02ANf2/5cZr8cf//iW4/srPQoi7CxkA0eXF5/0aHn76M7FXmXXsp/hn9rwSwH/3HNtf/N3fUoZfhTnwrAmw5l5xEy/ZlpWAVjSjcPK2KO59gxBm4hTL1d1lJaC0y/WcUSCjQsJdRBjWtpFCzNTpU/LlS1yKWQ1gGNuYHxsKFwdV7HmWzkaj7E/UJ+5bzZfNWPmugDLzzz8CNP53+60340/f+Ap84aIPQYi7ExkA0fCCh74eX3rWi8LWvgnYag0OwAj0TcB2E7JXe9Itl7aV8e3O3w6wTt0Yb+8moKkdcyxmI6wEIAg5bWtEvWuuYt1+361ZLdietxNcZyJ6BoLKhlk6UsgrlLHOw5cGWrKn1QLuwyp5E1dWEICmbrPKkTq5Nv9VE5B2zMT7f+s1uPxT74MQdzcyAMLxvzzk1fjaB/3AzN67ywTM7OELM/YWea/PBczuS7uMAguN34PdTIB11yBqXJuLmdliAsrW5GN5sYS7Z16WvV1LrUVC6ot42YdtAj+VTGhm+LlDcXXFUqfNMrY0XqljXFLtZ2sM6vbyH3xMLsO3BXqmyOJ9/50Xf/27P44L/vJ3IMThgAyAKGzE/7kPec0upfoz8rvWBHSMQH/PbAyL9WdFG9hmPHpx+wJPr9IWE9J7Ip4FaIZ2CXx7FvW9tSsbKUo9fTIgCnmI3XuQrzUB3u64JfTcXuIYRqLNhijM3EuOoU9BrIfb8hS3xov5spmw5rkJtxJDKwdstMoPDO28/tt3/Bw++p43QYjDBRkAMfCcB/9vexD/iJe7Q2ECthuBOxM/iLX1Suz1XbvHZk3CRJo3CttWAizO3hNCCY7VqcNi3pQE0GkP3bh+Gb3bl9QaoijMLLrD/+Vv/9vSfp3Fb1768XYz7rItzNipfP0YoDW3CRAE3Ys+3DK/f9bC/MrETp/+9p0/iw++U9/vLw4vZAAEnnzmi/B1574WB86hMwEc02b3UPyEmTWK+chFNGZKWAkfTECaayMuo7ex5kTb1dvDSkDNnaxDr27ycRoT0Mxw42sS8zBTB8XgVQLXbgq955kzPM2thDjDn+pNEeC+kQ+dMQ2zf0Rj4lYPQLcPrB1LKhPH23pjuPPfh//4V/DB35f4i8MPGYCFc+YJj8A/Pe+NuPPEueoMd9IE9PakO9VGMAG7GoFgLbaYABaYGGvc3hFMV9sLXZMvb0md+HBZhHbivf1pW1jm9nX7sayTWXtvHn7mXP5au53jxxl5qB+X4ev9d/hVABZs+H1jXXPGYgyfihGIZZ1ZgDdi/GzBx9/3n/FXb3sDhDgckQFYOM950A9hnx2Fg0dXJj0HaAJq9LjN+m2kXfIIUS3U7ZdCt61tJiAKtI81b5oMW+qkORPQGppoAmKcJjbTPBRIgt+ZxRvV6ZqArvEIZalt45zj0nrOyeCfPcjHPYv3VM6bAQQTgFAvtAEDfxsgH1OLxmMq+/lP/An+4nf+DwhxuCIDsHAeda/n4uCzu+Rum23vJbp1t860gz1l1JbbagI6KwFp14jzsdK8uWm+qGemTtcE5NzQCrmvw8Ie22v/dfXJSDQxowmI2znfIMbuL+dehHw8Bizo3FatU558QPtRwWwCUjUZ1Fb7FcLwtxHKWPnVhqsu+Qje819eASEOZ2QAFs5R+47FoaEnFx3ogn5gLWzfwm3YrtE6OW81AeGdzZuA7ufREQXd9moXqE7HBNCruXjWmZFz+d7sfIDFbnpf4rh+9Q3H+N5K7rw8H+vyCkOzgsAGgeP03nO5Xp1gsuL5klcEhif619Z/PiKlkusXL/s43vGmb8Ztt1wPIQ5nZAAWzlU3X4hDRxWhXY3AhkNpAqb4u+dxJ0xA6u3bVg/dtmbL8FLzljo8u+W60V6k1KszI+jJx4L1PkJnHbMwk2vIpwop3Mx7muOHuvE2gnVuN1D9hDBbpzbdmBo9OzAasjzb5zFOOWbzxT8J13/xc3jXr387br35WghxuCMDsHD+9OL/gEPLnqS/wjO1A27hYJgAOzATkNuYWQmYi7dtVl/3WKeudeN140fRhbc73YcRUy8G6krATHtlr1spiELu61po09xMPdQt5VLJZXaWD4RVl2AEhv3Wjhkdx9L3IPz1Y5WG6666CG//T9+M66/+HIS4JyADsHDeeeFP4JNf/BMcWng2x8Kzhf00AvttAvYUe28mwObepbmY1ogSsFcT0GvbuvuKMIZt/eV5bwK6xiDOvIMJaJ60R9tWmz89fR8FHOiuQrQ5pZoTxbRgCngVgAW9MTUzKwV+lcXn/Km/ewve8itfJ/EX9yg25/R+XGbF/x85Zt8JeP7DfhRPOOOFOOnoM3HoSFveTezqDPanhf6W2Mbu/wNIUSc7JWIbaX4fx7XeVjTT1rRLvVgnaH/tgfmyaUtOTovNj0EiRUzcQt5mPo9cO4Vpvrv1Pq3Vt2XHfclCjhzD2tzWJR7lb7l8dRhcv+RgtU7dRnnt/HfjjVfg0x97Gy746P/AJRe+F0Lc05ABEEIIIRaIbgEIIYQQC0QGQAghhFggMgBCCCHEApEBEEIIIRaIDIAQQgixQGQAhBBCiAUiAyCEEEIsEBkAIYQQYoHIAAghhBALRAZACCGEWCAyAEIIIcQCkQEQQgghFogMgBBCCLFAZACEEEKIBSIDIIQQQiwQGQAhhBBigcgACCGEEAtEBkAIIYRYIDIAQgghxAKRARBCCCEWiAyAEEIIsUBkAIQQQogFIgMghBBCLBAZACGEEGKByAAIIYQQC0QGQAghhFggMgBCCCHEApEBEEIIIRaIDIAQQgixQGQAhBBCiAUiAyCEEEIsEBkAIYQQYoHIAAghhBALRAZACCGEWCAyAEIIIcQCkQEQQgghFogMgBBCCLFAZACEEEKIBSIDIIQQQiwQGQAhhBBigcgACCGEEAtEBkAIIYRYIDIAQgghxAKRARBCCCEWiAyAEEIIsUBkAIQQQogFIgMghBBCLBAZACGEEGKByAAIIYQQC0QGQAghhFggMgBCCCHEApEBEEIIIRaIDIAQQgixQGQAhBBCiAUiAyCEEEIsEBkAIYQQYoHIAAghhBALRAZACCGEWCAyAEIIIcQCkQEQQgghFogMgBBCCLFAZACEEEKIBSIDIIQQQiwQGQAhhBBigcgACCGEEAtEBkAIIYRYIDIAQgghxAKRARBCCCEWiAyAEEIIsUBkAIQQQogFIgMghBBCLBAZACGEEGKByAAIIYQQC0QGQAghhFggMgBCCCHEApEBEEIIIRaIDIAQQgixQGQAhBBCiAUiAyCEEEIsEBkAIYQQYoHIAAghhBALRAZACCGEWCAyAEIIIcQCkQEQQgghFogMgBBCCLFAZACEEEKIBSIDIIQQQiwQGQAhhBBigcgACCGEEAtEBkAIIYRYIDIAQgghxAKRARBCCCEWiAyAEEIIsUBkAIQQQogFIgMghBBCLBAZACGEEGKByAAIIYQQC0QGQAghhFggMgBCCCHEApEBEEIIIRaIDIAQQgixQGQAhBBCiAUiAyCEEEIsEBkAIYQQYoHIAAghhBALRAZACCGEWCAyAEIIIcQCkQEQQgghFogMgBBCCLFAZACEEEKIBSIDIIQQQiwQGQAhhBBigcgACCGEEAtEBkAIIYRYIDIAQgghxAKRARBCCCEWiAyAEEIIsUBkAIQQQogFIgMghBBCLBAZACGEEGKByAAIIYQQC0QGQAghhFggMgBCCCHEApEBEEIIIRaIDIAQQgixQGQAhBBCiAUiAyCEEEIsEBkAIYQQYoHIAAghhBALRAZACCGEWCAyAEIIIcQCkQEQQgghFogMgBBCCLFAZACEEEKIBSIDIIQQQiwQGQAhhBBigcgACCGEEAtEBkAIIYRYIDIAQgghxAKRARBCCCEWyP8HOi6sq6zEjfUAAAAASUVORK5CYII=" /></svg>',
      },
      {
        type: 'out',
        symbol: 'USDC',
        name: 'USD Coin',
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        value: 1,
        price: 0.9998669999999998,
        imageSvg:
          '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><image width="16" height="16" href="data:image/png;base64,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" /></svg>',
      },
      {
        type: 'in',
        symbol: 'COBIE',
        name: 'COBIE THE BUILDER',
        logo: 'https://ipfs.io/ipfs/QmdWCVHoMvtDCAbgajnzAP7ZBNeBo9RgtkbqE4rJZWGYGq',
        value: 202344.646927,
        price: null,
        imageSvg:
          '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><image width="16" height="16" href="data:image/jpeg;base64,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" /></svg>',
      },
    ],
  },
  validation: { type: 'Benign', reason: 'exposure_farming' },
  error: null,
};
