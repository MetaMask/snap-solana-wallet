import { Network } from '../../constants/solana';
import type { ConfigProvider } from '../../services/config';
import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';
import { tokenAddressToCaip19 } from '../../utils/token-address-to-caip19';
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

export class TokenMetadataClient {
  readonly #configProvider: ConfigProvider;

  readonly #fetch: typeof globalThis.fetch;

  readonly #logger: ILogger;

  constructor(
    configProvider: ConfigProvider,
    _fetch: typeof globalThis.fetch = globalThis.fetch,
    _logger: ILogger = logger,
  ) {
    this.#configProvider = configProvider;
    this.#fetch = _fetch;
    this.#logger = _logger;
  }

  async getTokenMetadataFromAddresses(
    addresses: string[],
    scope: Network,
  ): Promise<Record<string, SolanaTokenMetadata>> {
    try {
      const { baseUrl, apiKey } = this.#configProvider.get().tokenApi;

      const response = await this.#fetch(
        `${baseUrl}/api/v0/fungibles/assets?fungible_ids=${addresses
          .map(
            (address) =>
              // temporal fix for the token metadata client
              // as this is going to be repalced by token api
              // and both repsonse token address and token address should be CAIP-19
              `${SCOPE_TO_NETWORK[scope]}.${address.split('/token:')[1]}`,
          )
          .join(',')}`,
        { headers: { 'X-API-KEY': apiKey } },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as
        | TokenMetadataResponse
        | TokenMetadata;

      const tokenMetadata = 'fungibles' in data ? data.fungibles : [data];

      const tokenMetadataMap = new Map<string, SolanaTokenMetadata>();

      for (const metadata of tokenMetadata) {
        const tokenAddress = tokenAddressToCaip19(
          scope,
          metadata.fungible_id.split('.')[1] ?? '',
        );

        tokenMetadataMap.set(tokenAddress, {
          name: metadata.name,
          symbol: metadata.symbol,
          iconUrl: `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${
            metadata.fungible_id.split('.')[1]
          }/logo.png`,
        });
      }

      return Object.fromEntries(tokenMetadataMap);
    } catch (error) {
      this.#logger.error(error, 'Error fetching token metadata');
      throw error;
    }
  }
}
