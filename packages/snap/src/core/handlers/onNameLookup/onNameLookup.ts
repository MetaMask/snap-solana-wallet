import { type OnNameLookupHandler } from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';

import { nameResolutionService } from '../../../snapContext';
import { SolanaNameLookupRequesstStruct } from './structs';

const SOLANA_NAME_SERVICE_PROTOCOL = 'Solana Name Service';

export const onNameLookupHandler: OnNameLookupHandler = async (request) => {
  assert(request, SolanaNameLookupRequesstStruct);

  const { chainId, domain, address } = request;

  if (domain) {
    const resolvedAddress = await nameResolutionService.resolveAddress(
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
    const resolvedDomain = await nameResolutionService.resolveDomain(
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
