import { normalizeBase64EncodedTransactionMessage } from './normalizeBase64EncodedTransactionMessage';

describe('normalizeBase64EncodedTransactionMessage', () => {
  it('normalizes a base64 encoded transaction message correctly', () => {
    const base64String =
      'gAEAChfds67pR0IYlL1XKFGjzC+zBZIA7vT1dj7nUBTUwAs7rBn3hrWmXImk+UetGwvWumZpcEhF+xT5THD5os2Svp67H8GdfJ4jkOslaYOff/X0SeF33Cha5Ij9DKlo3QaosfIhtgnDmdJAVdjfmyv5dEGsSWgYEYPaqW8v8hSJozhYIzcQa4p5MinFjNMq4vDm+n249hE5Vmwe+Adkq87GTDegPbdaVhuqlrT5hZnIkdcW67eCFvm9ZzXM9jeWm2GwnLBGfnLp6qHLD5IgtqLXr5clzwoa2ns4KdysosGA2yFHt2dBBA/kB6qwUEagfnGzH2GY12XE3va/gn3W4Loqy/D+gP5PMjWwL4nGY8i3EGxqLHt/i3x/EskcO1ftQjYqQtqMVVDE+U/Vngb6x6+HbBOGrDQOx73j0k813TrK9dmptLgHDBoOIz6tGmWT+r9wa3YtqouLIv01/IKynGlc4TnE0M2MheikqA6gkuj1PhXVDgPc7eSLCseVMCy/WUgTmKbXmnZ/QcH3X8YTJ//GR4yvL7LCHdfHPhS8B+4hpoFusQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKD0N0oI1T+8K47DiJ9N82JyiZvsX3fj3y3zO++Tr3FVRPixdukLDvYMw2r2DTumX5VA1ifoAVfXgkOTnLswDEoyXJY9OJInxuz0QKRSODYMLWhOZ2v8QhASOe9jb6fhZAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAC0P/on9df2SnTAmx8pWHneSwmrNt/J3VFLMhqns4zl6LwHxW5grT0/F3OC6sZUj7of0yz9kMoCs+fPoYX9znOYyUOdJ8PoWqEFw7H8n7xwkhg1P1tPfo1/6arncTl4PJkEedVb8jHAbu50xW7OaBUH/bGy3qP0jlECsc2iVrwTjwan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAA0LlMW0o1bBeKH7IjSDuI9G0a+7kgVaW9ubbU+rklS9sFDgIWFAkAi8sXoE0wggARAAUCuIEWABEACAMgoQcAAAAAEAYACAATDS0BARVDLQ8ABgUECCoTFRUSFSslKyIjBQooKiQrDy0tKSsMAwEVKyErHB0KBygsHisPLS0pKx8gFScPJhsHBBcZGi0JGAILFSzBIJszQdacgQMDAAAAJmQAASZkAQIaZAIDQEIPAAAAAAC78khRAQAAADIAAANOgLKSmCyUmuksqMclFoVdtmiFizz7/yF11zNd6VSAxgUkIB4dIwIhIrYRAfelfqMdEh4JHXx6VS3GXpyeWhNKQlBsx9m2I8c+BhMSEBEUWgDdfctSzc+t7n0tohMIoz7S6USQkKhKDRCUSx6C3SjhJQQJAg8EBgoMCwYQBw==';

    const result = normalizeBase64EncodedTransactionMessage(base64String);

    expect(result).toStrictEqual({
      ed25519Signatures: ['signature'],
      instructions: [
        {
          accounts: [],
          data: new Uint8Array([0, 139, 203, 23, 160, 77, 48, 130, 0]),
          programAddress: '3i5JeuZuUxeKtVysUnwQNGerJP2bSMX9fTFfS4Nxe3Br',
        },
        {
          accounts: [],
          data: new Uint8Array([2, 184, 129, 22, 0]),
          programAddress: 'ComputeBudget111111111111111111111111111111',
        },
        {
          accounts: [],
          data: new Uint8Array([3, 32, 161, 7, 0, 0, 0, 0]),
          programAddress: 'ComputeBudget111111111111111111111111111111',
        },
        {
          accounts: [],
          data: new Uint8Array([1]),
          programAddress: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
        },
        {
          accounts: [],
          data: new Uint8Array([
            193, 32, 155, 51, 65, 214, 156, 129, 3, 3, 0, 0, 0, 38, 100, 0, 1,
            38, 100, 1, 2, 26, 100, 2, 3, 64, 66, 15, 0, 0, 0, 0, 0, 187, 242,
            72, 81, 1, 0, 0, 0, 50, 0, 0,
          ]),
          programAddress: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
        },
      ],
    });
  });
});
