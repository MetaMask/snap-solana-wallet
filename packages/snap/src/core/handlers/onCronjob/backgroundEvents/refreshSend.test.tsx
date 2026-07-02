import { assetsService, priceApiClient, state } from '../../../../snapContext';
import { KnownCaip19Id } from '../../../constants/solana';
import { trackError } from '../../../utils/errors';
import {
  getInterfaceContext,
  getPreferences,
  updateInterface,
} from '../../../utils/interface';
import { refreshSend } from './refreshSend';

jest.mock('../../../utils/errors', () => ({
  trackError: jest.fn().mockResolvedValue('tracked-error-id'),
}));

jest.mock('../../../utils/interface', () => ({
  getInterfaceContext: jest.fn(),
  getPreferences: jest.fn(),
  SEND_FORM_INTERFACE_NAME: 'send-form',
  updateInterface: jest.fn(),
}));

jest.mock('../../../../features/send/render', () => ({
  DEFAULT_SEND_CONTEXT: {
    preferences: {
      locale: 'en',
      currency: 'usd',
    },
  },
}));

jest.mock('../../../../features/send/Send', () => ({
  Send: () => null,
}));

jest.mock('../../../../snapContext', () => ({
  assetsService: {
    getAll: jest.fn(),
  },
  priceApiClient: {
    getMultipleSpotPrices: jest.fn(),
  },
  state: {
    getKey: jest.fn(),
    setKey: jest.fn(),
  },
}));

const setupTest = () => {
  (globalThis as any).snap = {
    request: jest.fn(),
  };

  (assetsService.getAll as jest.Mock).mockResolvedValue([
    {
      assetType: KnownCaip19Id.SolMainnet,
    },
  ] as any);
  (state.getKey as jest.Mock).mockResolvedValue({
    'send-form': 'interface-id',
  });
  (getPreferences as jest.Mock).mockResolvedValue({
    locale: 'en',
    currency: 'usd',
  });
  (getInterfaceContext as jest.Mock).mockResolvedValue({
    tokenPrices: {},
  });
  (updateInterface as jest.Mock).mockResolvedValue(undefined);
};

describe('refreshSend', () => {
  it('tracks background refresh errors', async () => {
    setupTest();

    const error = new Error('Price API failed');

    (priceApiClient.getMultipleSpotPrices as jest.Mock).mockRejectedValue(
      error,
    );

    await refreshSend({ request: {} as any });

    expect(trackError).toHaveBeenCalledWith(error);
    expect(updateInterface).not.toHaveBeenCalled();
  });
});
