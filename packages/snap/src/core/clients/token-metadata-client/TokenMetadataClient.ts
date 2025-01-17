import { Network, SolanaCaip19Tokens } from '../../constants/solana';
import type { ConfigProvider } from '../../services/config';
import { getNetworkFromToken } from '../../utils/getNetworkFromToken';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import { tokenAddressToCaip19 } from '../../utils/tokenAddressToCaip19';
import type {
  SolanaTokenMetadata,
  TokenMetadata,
  TokenMetadataResponse,
} from './types';

const SCOPE_TO_NETWORK: Record<Network, string> = {
  [Network.Mainnet]: 'solana',
  [Network.Devnet]: 'solana-devnet',
  [Network.Testnet]: 'solana-testnet',
  [Network.Localnet]: 'solana-localnet',
};

const NETWORK_TO_SCOPE = Object.fromEntries(
  Object.entries(SCOPE_TO_NETWORK).map(([key, value]) => [value, key]),
) as Record<string, Network>;

export class TokenMetadataClient {
  readonly #fetch: typeof globalThis.fetch;

  readonly #logger: ILogger;

  readonly #baseUrl: string;

  readonly #apiKey: string;

  readonly #addressesChunkSize: number;

  constructor(
    configProvider: ConfigProvider,
    _fetch: typeof globalThis.fetch = globalThis.fetch,
    _logger: ILogger = logger,
  ) {
    this.#fetch = _fetch;
    this.#logger = _logger;

    const { baseUrl, apiKey, addressesChunkSize } =
      configProvider.get().tokenApi;

    this.#baseUrl = baseUrl;
    this.#apiKey = apiKey;
    this.#addressesChunkSize = addressesChunkSize;
  }

  async #fetchTokenMetadataBatch(
    addresses: string[],
  ): Promise<TokenMetadata[]> {
    const response = await this.#fetch(
      `${this.#baseUrl}/api/v0/fungibles/assets?fungible_ids=${addresses.join(
        ',',
      )}`,
      { headers: { 'X-API-KEY': this.#apiKey } },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as
      | TokenMetadataResponse
      | TokenMetadata;

    return 'fungibles' in data ? data.fungibles : [data];
  }

  async getTokenMetadataFromAddresses(
    caip19Ids: string[],
  ): Promise<Record<string, SolanaTokenMetadata>> {
    try {
      // Filter and transform addresses
      const formattedAddresses = caip19Ids
        .filter((caip19Id) => Boolean(caip19Id.split('/token:')[1]))
        .map(
          (address) =>
            `${SCOPE_TO_NETWORK[getNetworkFromToken(address)]}.${
              address.split('/token:')[1]
            }`,
        );

      // Split addresses into chunks
      const chunks: string[][] = [];
      for (
        let i = 0;
        i < formattedAddresses.length;
        i += this.#addressesChunkSize
      ) {
        chunks.push(formattedAddresses.slice(i, i + this.#addressesChunkSize));
      }

      // Fetch metadata for each chunk
      const tokenMetadataArrays = await Promise.all(
        chunks.map(async (addresses) =>
          this.#fetchTokenMetadataBatch(addresses),
        ),
      );

      // Flatten and process all metadata
      const tokenMetadataMap = new Map<string, SolanaTokenMetadata>();

      tokenMetadataArrays.flat().forEach((metadata) => {
        const [network = 'solana', address = ''] =
          metadata.fungible_id.split('.');

        const tokenAddress =
          address === SolanaCaip19Tokens.SOL
            ? `${NETWORK_TO_SCOPE[network]}/${address}`
            : tokenAddressToCaip19(
                NETWORK_TO_SCOPE[network] ?? Network.Mainnet,
                address,
              );

        tokenMetadataMap.set(tokenAddress, {
          name: metadata.name,
          symbol: metadata.symbol,
          iconUrl: metadata.previews.image_small_url,
          decimals: metadata.decimals,
        });
      });

      return Object.fromEntries(tokenMetadataMap);
    } catch (error) {
      this.#logger.error(error, 'Error fetching token metadata');
      throw error;
    }
  }
}
