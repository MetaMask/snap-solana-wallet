/* eslint-disable no-restricted-globals */
import { getBip32Entropy } from './getBip32Entropy';

describe('getBip32Entropy', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Object.defineProperty(global, 'snap', {
      value: {
        request: jest.fn().mockResolvedValueOnce({
          depth: 2,
          masterFingerprint: 3974444335,
          parentFingerprint: 2046425034,
          index: 2147484149,
          curve: 'ed25519',
          privateKey:
            '0x7acf6060833428c2196ce6e2c5ba5455394602814b9ec6b9bac453b357be7b24',
          publicKey:
            '0x00389ed03449fbc42a3ec134609b664a50e7a78bad800bad1629113590bfc9af9b',
          chainCode:
            '0x99d7cef35ae591a92eab31e0007f0199e3bea62d211a219526bf2ae06799886d',
        }),
      },
      writable: true,
    });
  });

  describe('when we have a valid path and we get a response from the Extension', () => {
    it('returns the correct entropy', async () => {
      const path = ['m', "44'", "501'"];
      const curve = 'ed25519';

      await getBip32Entropy({ path, curve });

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_getBip32Entropy',
        params: {
          path,
          curve,
        },
      });
    });
  });

  describe('when we have a valid entropy source and path and we get a response from the Extension', () => {
    it('returns the correct entropy', async () => {
      const entropySource = '01JR0PT6PNGBN7MRM3MPEVQPC0';
      const path = ['m', "44'", "501'"];
      const curve = 'ed25519';

      await getBip32Entropy({ entropySource, path, curve });

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_getBip32Entropy',
        params: { source: entropySource, path, curve },
      });
    });
  });
});
