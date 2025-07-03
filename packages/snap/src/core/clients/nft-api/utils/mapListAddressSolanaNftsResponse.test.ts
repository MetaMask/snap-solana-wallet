import { MOCK_NFTS_LIST_RESPONSE_MAPPED } from '../mocks/mockNftsListResponseMapped';
import { MOCK_NFTS_LIST_RESPONSE_RAW } from '../mocks/mockNftsListResponseRaw';
import { mapListAddressSolanaNftsResponse } from './mapListAddressSolanaNftsResponse';

describe('mapListAddressSolanaNftsResponse', () => {
  it('should map the response correctly', () => {
    const response = mapListAddressSolanaNftsResponse(
      MOCK_NFTS_LIST_RESPONSE_RAW,
    );

    expect(response).toStrictEqual(MOCK_NFTS_LIST_RESPONSE_MAPPED);
  });
});
