/* eslint-disable @typescript-eslint/naming-convention */

export type TokenMetadataResponse = {
  fungibles: TokenMetadata[];
};

export type SolanaTokenMetadata = {
  name: string;
  symbol: string;
  iconUrl: string;
};

export type TokenMetadata = {
  fungible_id: string;
  name: string;
  symbol: string;
  decimals: number;
  chain: string;
  previews: {
    image_small_url: string;
    image_medium_url: string;
    image_large_url: string;
    image_opengraph_url: string;
    blurhash: string;
    predominant_color: string;
  };
  image_url: string;
  image_properties: {
    width: number;
    height: number;
    size: number;
    mime_type: string;
    exif_orientation: number | null;
  };
  created_date: string | null;
  created_by: string | null;
  supply: string;
  holder_count: number;
  extra_metadata: {
    showName: boolean;
    createdOn: string;
    is_mutable: boolean;
    creators: any[];
    token_program: string;
    extensions: any[];
    image_original_url: string;
    animation_original_url: string | null;
    metadata_original_url: string;
  };
};
