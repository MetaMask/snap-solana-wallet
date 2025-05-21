import type { GetLatestBlockhashApi } from '@solana/kit';
import { blockhash, lamports, type GetBalanceApi } from '@solana/kit';

import { MOCK_SOLANA_KEYRING_ACCOUNT_0 } from '../../test/mocks/solana-keyring-accounts';

/**
 * Sample response from the Solana RPC `getBalance` method
 * This is the response are received in JSON from the RPC.
 *
 * The Solana SDK then transforms the response into a {@link ReturnType<GetBalanceApi.getBalance>} object,
 * where types slightly differ, see next mock.
 */
export const MOCK_SOLANA_RPC_GET_BALANCE_RESPONSE = {
  jsonrpc: '2.0',
  result: {
    context: {
      apiVersion: '1.18.22',
      slot: 302900219,
    },
    value: 123456789,
  },
  id: '0',
};

export const MOCK_SOLANA_RPC_GET_BALANCE_AS_SDK_RESPONSE: ReturnType<
  GetBalanceApi['getBalance']
> = {
  context: {
    slot: 302900219n,
  },
  value: lamports(123456789n),
};

/**
 * Sample response from the Solana RPC `getLatestBlockhash` method
 */
export const MOCK_SOLANA_RPC_GET_LATEST_BLOCKHASH_RESPONSE = {
  jsonrpc: '2.0',
  result: {
    context: {
      apiVersion: '2.0.18',
      slot: 346468641,
    },
    value: {
      blockhash: '8HSvyvQvdRoFkCPnrtqF3dAS4SpPEbMKUVTdrK9auMR',
      lastValidBlockHeight: 334650256,
    },
  },
  id: '0',
};

export const MOCK_SOLANA_RPC_GET_LATEST_BLOCKHASH_AS_SDK_RESPONSE: ReturnType<
  GetLatestBlockhashApi['getLatestBlockhash']
> = {
  context: {
    slot: 346468641n,
  },
  value: {
    blockhash: blockhash('8HSvyvQvdRoFkCPnrtqF3dAS4SpPEbMKUVTdrK9auMR'),
    lastValidBlockHeight: 334650256n,
  },
};

/**
 * Sample response from the Solana RPC `sendTransaction` method
 */
export const MOCK_SOLANA_RPC_SEND_TRANSACTION_RESPONSE = {
  jsonrpc: '2.0',
  result: {
    signature:
      '4RP4QUT4Vxf1vkNMHw93ZgYAhWsUsiEkDatuP3nKtytkcZhMH4hMMEkdrdbvRkxWUhm38K4dT24pQiEwrL12uQVA',
  },
  id: '0',
};

/**
 * Sample response from the Solana RPC `getFeeForMessage` method
 */
export const MOCK_SOLANA_RPC_GET_FEE_FOR_MESSAGE_RESPONSE = {
  jsonrpc: '2.0',
  result: {
    value: 15000,
  },
  id: '0',
};

/**
 * Sample response from the Solana RPC `simulateTransaction` method
 */
export const MOCK_SOLANA_RPC_SIMULATE_TRANSACTION_RESPONSE = {
  jsonrpc: '2.0',
  result: {
    context: {
      slot: 218,
    },
    value: {
      // eslint-disable-next-line id-denylist
      err: null,
      accounts: null,
      logs: [
        'Program 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri invoke [1]',
        'Program 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri consumed 2366 of 1400000 compute units',
        'Program return: 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri KgAAAAAAAAA=',
        'Program 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri success',
      ],
      returnData: {
        data: ['Kg==', 'base64'],
        programId: '83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri',
      },
      unitsConsumed: 2366,
    },
  },
  id: 1,
};

/**
 * Sample response from the Solana RPC `getTokenAccountsByOwner` method
 */
export const MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE = {
  jsonrpc: '2.0',
  result: {
    context: {
      slot: 302900219,
    },
    value: [
      {
        account: {
          data: {
            parsed: {
              info: {
                mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // USDC
                owner: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
                isNative: false,
                tokenAmount: {
                  amount: '123456789',
                  decimals: 6,
                },
              },
            },
          },
        },
      },
      {
        account: {
          data: {
            parsed: {
              info: {
                mint: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC', // ai16z
                owner: MOCK_SOLANA_KEYRING_ACCOUNT_0.address,
                isNative: false,
                tokenAmount: {
                  amount: '987654321',
                  decimals: 9,
                },
              },
            },
          },
        },
      },
    ],
  },
  id: '0',
};

export const MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_AS_SDK_RESPONSE = {
  context: {
    slot: 302900219n,
  },
  value: MOCK_SOLANA_RPC_GET_TOKEN_ACCOUNTS_BY_OWNER_RESPONSE.result.value,
};

export const MOCK_SOLANA_RPC_GET_TRANSACTION_RESPONSE = {
  jsonrpc: '2.0',
  result: {
    signature: '123',
  },
  id: '0',
};

export const MOCK_SOLANA_RPC_GET_MULTIPLE_ACCOUNTS_RESPONSE = {
  jsonrpc: '2.0',
  result: {
    context: { apiVersion: '2.0.15', slot: 341197247 },
    value: [
      {
        data: ['', 'base58'],
        executable: false,
        lamports: 88849814690250,
        owner: '11111111111111111111111111111111',
        rentEpoch: 1844674407370955,
        space: 0,
      },
      {
        data: ['', 'base58'],
        executable: false,
        lamports: 998763433,
        owner: '2WRuhE4GJFoE23DYzp2ij6ZnuQ8p9mJeU6gDgfsjR4or',
        rentEpoch: 1844674407370955,
        space: 0,
      },
    ],
  },
  id: '0',
};

export const MOCK_SOLANA_RPC_GET_MULTIPLE_ACCOUNTS_SWAP_RESPONSE = {
  jsonrpc: '2.0',
  id: '0',
  result: {
    context: {
      apiVersion: '2.1.11',
      slot: 321903321,
    },
    value: [
      {
        data: {
          parsed: {
            info: {
              addresses: [
                'HREZ888X87QTsvKJeAKxtnGUebgoM7ptF1B5jughTADC',
                'DiKDYvWPsxLnP6qM878i26UnqRGHXGqsKe64wra9gqwv',
                '6YdD7G2uPRWRie7krnoMmDg1PnMsFMRKNr9keK1wNwJ4',
                '2BUu8fyQfyz6B6D8sQDk3CPkKPsJfQDyW5KTcDmj4u7G',
                '3pckZriVKu22AT4CBbSbXUvLs5tUDqcrWHYiiF3aDgcs',
                '2xegPxVVRQJgje3gPFRPAsw4R27aEGP8C535azD7J1s7',
                '8crbKyttXzwFqtB9ptw8M2LXgh497QWzwoaFcbYBrxrr',
                'yQtvBQQwNML1fukwU3BVV7gK8vhpiAxXuWWSrEUn6F1',
                'BiVhEomHTzQsLSBCWJJjyVbLZbTsyz3tXmP3WB1wCCT',
                'AkZfSyBpBJn36Y4DRduoUMKKWMQ6w3idQU1E5ATtFqs7',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                'EruBqmvHVLoJdMo3FfFE4dZPL18Q2rkzCv8yuw6DeAk9',
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
                'F6DCuH3ifbfDZVZVNVFcbdjamkvJ7Y796cyw4GpZeUw7',
                'F26B9svY52m7fXgh54wfbFzd2JNX98AE2cTsT7K1JkDc',
                '7Vp27DT25hV8Uz89XpYvoNbZwtf9CSmtGgjJjEnL96iV',
                'FqKwBpWSR7HBJLzKLovn69KQAqcNCnhFb1357s1GfwQB',
                'D1ZU2ekM7thxF66ftY6wP2Botfx4toF5L5tqaZj7x3Tg',
                '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                'EEnnZ3kqcyuTHCwVVxLzZ6zKLVZcZMaYeyubK4kxHKMi',
                'FRbShKGBpR7YRmdxisbshvhs3Gs93E8fJiVU6sTMNVwu',
                'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
                'G8baZahwtwtcuzuyG2EjPwyKGrXMVsuwSkXWxRiKtsPY',
                'G9QWhqhYigRoDNcXsekhouX7vxNQMeYp6dcbcjB2AAVp',
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                '9MceeWigR7f5x28xsM2C95mvY5CLswMxvxgz2iUuQLLB',
                'C6eYeinELaXkGU7RxYrC13YxLmrod4cpwQvSAFqWYLh8',
                'AwW2pD6YjERyXP7XPWYU8KGWXA3pT1EJGXo1an7TUcVD',
                '3x5XhDAoGkVwHweVxsTRjy1zT8vstXnTZWUVqxpjm9v4',
                'ZYZTotNXxWVifsngRYv7TfVxHrGgxTbYDPJtJHvUWqH',
                '36CJp81kBeBJzkPG5NT1BCLSkBx997KbL5s5yTWokC6B',
                'A4ivspP9X3bi6rdUteDUpm77q1BWfFQRwZoghQ3xW27w',
                '4hAfJov7TWFMmse8NsRBGYPwZf5FsDeg7D7CfyFmv1La',
                'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
                'B81qdKcZSWR3srCiZkwq2X6shhKFsjhMtscgmEAjCWRF',
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                'SmQhH6u6iYBdSQyRfiPLicGBk2Q3B1oA1fm3vtA693q',
                'DUfugzmPV8XYPheSkMN1V21VVuHS67baB1Z77s4qpA57',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                'ByKzZCyWAnh3Q1pStTx2wwfd4U7eXrCgz6SYe25DGcj6',
                'GnGruVf8LAzzFrDes2dLc7K4RunCHhgrjJaaASDKW9zz',
                '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                '2uDMzq3sttgeG116wiwQR2hkrh46baqcTzLbhqnDtkze',
                'Hvucz8RFNZ5sg74hbhtp2VkvLkXienUEW78n6PqJWHKn',
                'Hx1HvG22c1MhEPG7bVG5DMCbdPWxzaf5DDJBRhFg136R',
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                'ChXvtnn5HxijkT1DzmyFpByYRBZMdHAvEVQxuU2a3LW4',
                'ENtGvqetaQn4fMfWJJSBtD5GZKvjtfm3nyzncrtsAJZE',
                'H2ojTAUcg9xPDNXbN2Xbo8VXoj5udUciFhVGQnVpKVDh',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                'Gw7PQipXiMn1g5wZPp52u3H7kUoT4GbWDTgWsYpvD1Pe',
                '149JGfRzUzzApb9iYxyMDQrnu93gm3yP7ZQhYdekEn67',
                '3MSvHTen1aWjMYK6tZ715jHCyC6TJaDHMWhgoToEgYGh',
                'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
                'HAMdvTSZCGo3x4oG2ujCqYsmYHE7FJNphaicrejuSREp',
                'GmBsYQmhv9vfppUxTX6xwJ6HwnoycZEZMXwjEJzNqHvh',
                '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                'J2W4MShfiHSxzz6biHQoc8TQYuGK9cAEzWDp6b78meZ9',
                'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
                'DPdkaSwjosj9joTqbbmZnU5DuVzadMqng2nzsJW68mz9',
                'FecWqjmfnJHcZSg4mcNcveyBj6cgf13Acxm9BjjaHrs7',
                '5v2481hYo3a4KGMqFNcXKw8gdJ8G25z9yAFMAvLzwfkt',
                '9YYd6kY3DMXe1xmB8iMHdDkqyAVcudkffPDsbhb2k36M',
                '51DJFVzNFUQp9yLynqu9zzQiYc8tqGscdYrxUbcb894k',
                '2FYaVDoHw9bESMGz5i1nSgArhLKeZePSL8Wrhrgrby2d',
                '6fYQQTgbc1egnTwkiMKwnubipA4umi4wMqffRo6P4Y5k',
                'G3KmxbH8Vt2ewRgkoDhLbKYSwGj1P1Cvm9zKaRLH74rN',
                '3NRNgN2ufeqDiM85Zngo7fn79g1v1pS4JGpCz4m7upCj',
                'FpkdNNjnWNuKpsPRMNXxAc1op8JrWEMp86ZUQQuUWMuE',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                'FageLLgj7pY9v8k4XW3zxt8qSXnipHh7WEYMaepAvQdG',
                'C1iVk6hC17N5mKDneBx3bgqVLd3YNkUsUk2eHWWbcgTA',
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                '67imZAjqx1ct7e1L53x5m47pvPZ5k9VausYky48H8zor',
                'B3dEApEqveDwbZDR1HVWCG6ngHuzDWbP5KbzwPbpeacX',
                'HDbxPjkxefR4PZeSobVEM5FsDKvQJJWoekuh8hzKcqYC',
                '3k7nzqcHgSHVe2dvuSinhvTYrEdTcPsbRXaWUJBcC86f',
                '9PBZsS684f986BPJaTinycDt8Cpd2iWZuaLogcABuM5h',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                '8iTeSFsvdcuNQtPyern6kQwhAuMs6HyXJD4FnxZRcHds',
                'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
                'C3jVirjchwhTL5Ems7m5shgLfJb6Lt8AJNasuLKzrtEp',
                'Etk9ydGao3y3woYyg1NZAXMEbABWTjG16N4ypQ5CbEjT',
                'E2CXWLFMQWrJEJgFjtqHDFJ7tfVjVERJH7dxPssuAaH5',
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                'AzNjPa27Uot7PfY3u5UmiC7v9ZrmwtiY846qavrCK1YQ',
                'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
                '8a3XLDq3THpwTrn5kXk3ABaxPyC3NHu6dtNiRXoWbpQg',
                'Ew71AgEjxjjrvFx3zNZTZbsdcL4SVAvaewFHtpoTwGiF',
                '2dm9LQZN3rrRPHFBrSCGD8JXa4W8ox3XcGmjH9vp5VLB',
                'DRDf42Qcm6K87x3hWVEMAcUa1BrkGSE3bi5fJoNTKbpJ',
                '81EUcgVpFUXJD9suqWsNcU9MhNBMVMrKqj8jFfJFm5Wc',
                'ErJ21oGA4iBdADYjUUkpu3DTHZAEYZGPFhGEP9ZXDhhH',
                'HnfKgrRN4V7t8ZEPAe6UuZYRhWETZRRbvqVYp79CRQR9',
                'NQ3mhG7kaa95bpFL1sfQE6JLZANe8cwGc1DyUsLbbN6',
                '7ASJW9sKpiWxf2cA1JhSLrLgNncLLXYmPVKWQvMnC74a',
                '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                '5L5fopDvMbwfMnbZYcfpQKBmcdBTPjF85Ew1CqevZ5AF',
                '6VPkbA5Ptq7qXdnYVTMaAJG7Tbxr5FWseSJwADcu88Q6',
                '5YWezNUdxeh569TEyg72V8m4Wr7xmrQzmqai25AXiD5P',
                '8i5kBSFuaxrdZRbXvvMPyAdSvZEN3626Yyh67DEKXac8',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                'D1dFxbLY5mnVwLXEs1cii9U9emDLGzpKC9NP2BSceBak',
                'H1sY1cHZLZgxinbKFm7qCHP5Hq1EpUVadTsADkgCdTsL',
                '4Y77dBwxPnebSqhkdSP1WTk732QbzQbLqGdAzmnPYE9b',
                '3PwrgzNzpN7jikebZaFvCR7CWmZ1aozifLbgJqLE3Y3o',
                '6E7woKnfTuDJvLb82knPgLZFE7j7W3X4j6bgMrvArNNm',
                '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                'H2hXrDE7Mok9Kgr1beNafRSbBGUJ6GL1T1pW6WXzqyZa',
                '4qdgmwDZDUwiJmqxkpjiVoo61opn24m84FmbTa3s84F8',
                'BdfTDurcZKmGVbdegvrPpiLuDV36PKmeQr5Ag2mdDo4X',
                'AqWp6WmYYgQrBDjBE1MJTXNqNGkjNm1AcYJdiYrXzWE1',
                'DHigkV7cHQoigt2sHMQmMQw3CFHZ14qgD9AHMDSg1pUJ',
                '2jdm2JgGvhpd1U6GAchXwHgz41hccWjYVCLFjhrafNHi',
                'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
                '7xLNmesQAdebcnhrDL4FG7dP1REjHvg733XkcuaxE7Bi',
                'FtUD75JFdvHkKuoMrsKBLGYJ76LC1cZCNNUattXnEnCa',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                'DZf1LQzEzJwe2fBRvvDycxiANmeYZFqszf25HA7eKbpM',
                '6F4ww5Ghv2okxt1RaU1GHfXR8P7tRjtRP7HGiQdvVrRe',
                '8HBqQ4efRwmxk9CPccDz2ahVoTWC5GQsZqnczr29CBQZ',
                'CXUy7n2zf5SeNcJwVC4ektWVGiXTb7XoKpPXRyTyYAX4',
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                '4N3ZBJdZxuEAy27USBSN5PkH773pR6oee7VxfUgzySB1',
                'GN4KrwyNHM7szw6RLpoPEymFNhvKHcWv9CQJ6NocN9EU',
                '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                'BbJiEVd78ZqcDUweNJKBJiTXa4t1jkvU34e9t8XtpCaj',
                '24Uqj9JCLxUeoC3hGfh5W3s9FM9uCHDS2SG3LYwBpyTi',
                '9xKXVWtGKhUduWbo3eXvFERXY3JLqaVGJvM5q58Gu5Fj',
                '52ZjrBJDGueUBegcdknHZcwa5bnAiJcAJ65hgymxDdRB',
                'Ffbcj42eVwz8fiaQi7KEGbqUcDnK2gw1bY69NihfghM1',
                'G9U1fpzkg4o7ioTX7DaKhnEXuHz8aWRqD6k4ennh4v8H',
                'C2QoQ111jGHEy5918XkNXQro7gGwC9PKLXd1LqBiYNwA',
                '3ESUFCnRNgZ7Mn2mPPUMmXYaKU8jpnV9VtA17M7t2mHQ',
                'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB',
                'Ad2ZNCeJqW8SuJoLTTfiBWX15SZHqNJvz7YWkYysTBxd',
                '7pmaHfX11S3tsAC1mCWibDSzCrvnLJYEq6zRegvNSCwC',
                'GsvzF8sg4bxyorwPwKATg3RMqFP8BYPWFe7gimhktfvV',
                '3S8MReyVenuGcNaUQtmaXvtpcidrCobugvZ1brDJLFNL',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                '3RpEekjLE5cdcG15YcXJUpxSepemvq2FpmMcgo342BwC',
                'FrucERshacaGRC3EFNa7s7naq29GtsMhyaHEXC8gtfL7',
                'So11111111111111111111111111111111111111112',
                '4DdDnGj5i9isbAto17Yg4Qm3cWi8u3rZ2qZaKKHx9YVP',
                '99MEkgL9dt76RHY6JEgsUkSxqceAb7p6WRVgoTqJHcDh',
                'Bp1VjN2nMxqC8886bNEqcWQc56YjHUwkTriKwprvkN9d',
                'BwDGfzTAswc52ek5UmvNjAFVyZPBcKtSPv99t3tqWZdc',
                '8XsBaY5TkKuyVH7CJ9QVQEXfZm7dhUVjsHqjEr4964Qp',
                'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X',
                'fEQ8hnNYWavAWa55w6YNx3LjN6Hr34MJebhfUifafSv',
                'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
                'BWV7LL8qpkzX1jBeh76WCok9iTrQxc1e3ELfoHL2bFoE',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                '5LKDPgKQvrQw7fqJMUnDFQ5FehZu55TnatKpkWcFsYXC',
                'Hhvs2Siw1vPpMxV36RTGyJ9xLb14XHkKGzmNrZ1RZwbo',
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                'FzojgGjMNQa1iZnD31DDvX27rgnu1wEFQEu2szwsVWzs',
                '9YnPcoYSXLFWCYF97ZH5BC3vBw2CR3xfDvoM3aK12uHG',
                '7Cb2QG9Eo56cQbXtmgGuuxUykVzH38G6GwczQbeQrnjh',
                'AJHkAsdhF4WDV6UaxSVghgDcV4AuNGvTiY9MYr37mjwm',
                'HshSyyBZzsrttdum5pak1pQosNRs8D6u1Qm9bQGy4qtR',
                '2KQ3pZPtrt82LgVHMB3wtq4C8fHc1CaFq3aKgpTepbdd',
                'cQ4FTFhRE5ZFKQvYK7YJXf23xi4PqQzZVQo323yQK8s',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                '669w3x8jVyxCbH6scwYEVZRsKrwgtTqkrSST3DRSBz1n',
                'uzEaKQYQ9A5uQxLNe5xnajVBheY7d2SSaXTAeGAnAMa',
                'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
                '2awwFbLKpdD6xkRQgL5iPeyqfwGcVZ6HLZsyEUbVmt4y',
                'G1Bidv3Y2gMYK2CvApHNAZEHxSzQyryen3gTtLE4B3Zo',
                'DtJ7TArT6NC7cKycMqvcHKNDw3y5zDpKAUbWCsew8hCE',
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                'AxLENVumKMXJePD7PVWjKc4cEUcpn9CnxUgqtoyqNAyP',
                'F3QRbkLL3V4NmtiXBd61N29HmLwb2o6tUzMgSR5CgG3E',
                '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
                'FaF5XKRqTNaQ7zXwYNtpig2Q1HArtzJK4xB8XxHERF2j',
                'HyaB3W9q6XdA5xwpU4XnSZV94htfmbmqJXZcEbRaJutt',
                '8NsPwRFYqob3FzYvHYTjFK6WVFJADFN8Hn7yNQKcVNW1',
                '2SgUGxYDczrB6wUzXHPJH65pNhWkEzNMEx3km4xTYUTC',
                'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
                'J4uBbeoWpZE8fH58PM1Fp9n9K6f1aThyeVCyRdJbaXqt',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                '4maNZQtYFA1cdB55aLS321dxwdH1Y8NWaH4qiMedKpTZ',
                '3f9kSZg8PPJ6NkLwVdXeff16ZT1XbkmT5eaQCqUnpDWx',
                'JAWgN4bAxDcYoMfHNNhMvJcPuqVJUuxRWVbJoPx1QL7E',
                '6SiLPJmmdg84g4Jbmp1iorraobhXu6db2nrwmcyxEMC7',
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                '7bRpEMo6s4GeVyX6wTcKJGYbbauHmCxr9Ptb58Rxg5GX',
                'XoMz8McUzcw2AEHf8tRVT7pEyTznsCtVBpEQMCWGkvg',
                '5R7QQV3eCQTahT9muvevrKGe8zHNFnpVg7oHwhRKQNgr',
                '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                '6U16UMAd2WBwAYAN3Y7LFUVWirnhRBzHzadhVUgPid31',
                '5H2cQkkzuySY6jgrRaJed4T3YSJnWBh6ce3wJcS6knHA',
                'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
                'FcrhQ9sWKik6n6R56KXjJikzoa9fad9oQ3CHjHztLNHe',
                'H2KJCsVWYz93P55tMQMkY14C67J2BBj32wAAWcWArSv7',
                '8xfRcTKyibkSpMd7hGATrytn2nUxShSzJsYiRsCK4RYy',
                '8D5E6C9FhB8r3RT3fYToVp631sg2A9AbBEsP9Ubvr9mV',
                'EzPuL3yy2FSXWDtnoeCbn1Lv16QiNAKifRgao82XEYc1',
                '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                'EbRxPXvCBNJokgDtyvdcr4pkUM5u9JT8QpyS8EJkgnhh',
                'CK8gqhPfxR95Tsvu7nBaHu2RCBQ8Mvu785cMEenKFWiN',
                'Dn228uL4RwycvrkK5WhMz9Hw3Br5923PBhZAMpzkZxWf',
                'H3X4EbS3K8T8je5fwcW2bffNEW9YcCcAGBPQApGXhiNu',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                'rQwq41MsC3m2J1NMPk4n1Y5tN48qcsEnu6ofbx6U9uW',
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                '7Cy9GodEATUs77vUgkoKjXoGApmh57AUEo9mkE6uaHtk',
                'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
                '2VAJcCNx2THcHBSdMNT5pTEWnPUdtseZMvm9Cu1oVVSP',
                '8cBAopx1ZJL6PaoqXdK2BsC8WzqAxWrUWSAqMjHnLj8f',
                'nH1RDJ7rWnWyeS3kCFUJgVqGLatQhPEMMaLznNQpFcp',
                '3tmrC2GQCBxNHNTwYwm2AwLrdkVfxgrpiNgwMhap9Nm4',
                'VyVmemL7RadhEiYPBKuzobwZxWggdqS4ZN6PgthpkZe',
                'BKz84s7gDVWnwoy8CWtbkED7uzBu8DvJCJ9ejGPnsMgj',
                '3zmw3hDuL9kX8nMkHmeTdrguDNcCpnQCAkcLCWuGUTHn',
                '2HdVCtarXcKavkb5fNMrhAKzxsrbH6GkBryGgMf2BBpw',
                '8g7mhDYHF2wXP3DMFSxVuCXyxAhVLcipLQkNoAJQPnw3',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
                '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                '8zpEKWHCaNLUcRpiYSso3WaBt7QcXsWyjTWpyWRF1CEz',
                'GzwwRGtMcZGTi3o6ea5RU6Hc4gFN1GqYfLxLegmGqKhb',
                '9QSg2wBCoSUXCCbkrvTLMa8XDLgaFy21AZPb8pwoibmi',
                'GNSSfmNkdmYs6aBoKkZFVTbGGc9H4jiAyn897CycDnfW',
                '8HL86TkcgRB1iX6JNYpCweVeykrAKfhoaTqd1NoobFWq',
                '4DjytwhctoApB2CRmKg7MdRrWmTkYfXTRQghsoXxVp7r',
                '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                '9kgwxfTrnDitGKcK9werYCVfHKhaKgQXpdiG1KTjLx8s',
                '3Vdax95kmeqH8mmAbwgjhLPvWmZQC977zbb3yJ2m9Fpk',
                '5uGHgWTJZ836cUJ8AEMjT2gFaLyjEdXXmj5yXuVNyatw',
                'DqFZaFNuFk7qn4DxFRrFgVedqJQDKiwvx9MEzwNo4cMN',
                'AguewXNWtbenJsLp48uMdpWyme3iepvLV9jm5BQc2EW3',
                'AtUWQLBDLnjQVSfBC6zoQJkz2VxZqsebX9HWVnrA7UtE',
                'ESuiLQrTLbTpY1d2TGZMrPsRCs7KWsyofRhg6fL32SqW',
                '8wHsyHgbxpt6ZqzSNioV5YaB9iSvWYGWtB2APsFg5NaB',
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
                'GdsTmfYydJx4P4N2ZNNH1yWg1br9JtEt247b1vcYnJK7',
                'E3Bvd17zj3hJPz6UWthJMQV2FhmcCYJNzMP9zSTBFKfo',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                '4RPfVs7LR3DEvmpx6ZBavLWp12UjsgndC929m7iuDrJP',
              ],
              authority: '9RAufBfjGQjDfrwxeyKmZWPADHSb8HcoqCdrmpqvCr1g',
              deactivationSlot: '18446744073709551615',
              lastExtendedSlot: '240115532',
              lastExtendedSlotStartIndex: 225,
            },
            type: 'lookupTable',
          },
          program: 'address-lookup-table',
          space: 8216,
        },
        executable: false,
        lamports: 58179240,
        owner: 'AddressLookupTab1e1111111111111111111111111',
        rentEpoch: 18446744073709552000,
        space: 8216,
      },
    ],
  },
};
