import type { Balance, NftApiBalanceType, PaginatedResponse } from '../types';
import { mapGetNftMetadataResponse } from './mapGetNftMetadataResponse';

/**
 * Maps NFT API's snake case to camel case.
 * @param data - The response from the NFT API.
 * @returns The mapped Nft type.
 */
export function mapListAddressSolanaNftsResponse(
  data: PaginatedResponse<NftApiBalanceType>,
): PaginatedResponse<Balance> {
  return {
    cursor: data.cursor,
    error: data.error,
    items: data.items.map((item) => ({
      chain: item.chain,
      address: item.address,
      tokenAddress: item.token_address,
      tokenId: item.token_id,
      balance: item.balance,
      acquiredAt: item.acquired_at,
      isSpam: item.isSpam,
      nftToken: mapGetNftMetadataResponse(item.nft_token),
    })),
  };
}
