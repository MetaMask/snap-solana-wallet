import { type OnNameLookupHandler } from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';

import { nameResolutionService } from '../../../snapContext';
import { SolanaNameLookupRequestStruct } from './structs';

const SOLANA_NAME_SERVICE_PROTOCOL = 'Solana Name Service';

export const onNameLookupHandler: OnNameLookupHandler = async (request) => {
  assert(request, SolanaNameLookupRequestStruct);

  const { chainId, domain, address } = request;

  if (domain) {
    const resolvedAddress = await nameResolutionService.resolveDomain(
      chainId,
      domain,
    );

    if (resolvedAddress) {
      return {
        resolvedAddresses: [
          {
            resolvedAddress,
            protocol: SOLANA_NAME_SERVICE_PROTOCOL,
            domainName: domain,
          },
        ],
      };
    }
  }

  if (address) {
    const resolvedDomain = await nameResolutionService.resolveAddress(
      chainId,
      address,
    );

    if (resolvedDomain) {
      return {
        resolvedDomains: [
          {
            resolvedDomain,
            protocol: SOLANA_NAME_SERVICE_PROTOCOL,
          },
        ],
      };
    }
  }

  return null;
};
