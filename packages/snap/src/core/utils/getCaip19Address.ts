import type { CaipAssetType } from '@metamask/keyring-api';

/**
 * Extracts the token address from a CAIP-19 ID.
 * @param caip19Id - The CAIP-19 ID to extract the token address from.
 * @returns The extracted token address.
 */
export function getCaip19Address(caip19Id: CaipAssetType): string {
  if (!caip19Id) {
    return caip19Id;
  }

  // get last part of the caip19Id
  const lastPart = caip19Id.split('/').pop();

  if (!lastPart) {
    return caip19Id;
  }

  // if the last part is a currency, return the currency
  if (lastPart.includes('iso4217:')) {
    return lastPart.split(':').pop() as string;
  }

  // if the last part is a token, return the token
  if (lastPart.includes('token:')) {
    return lastPart.split(':').pop() as string;
  }

  return lastPart;
}
