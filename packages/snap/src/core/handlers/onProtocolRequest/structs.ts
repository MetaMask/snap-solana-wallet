import { enums, object } from '@metamask/superstruct';

export enum SolanaProtocolRequestMethod {
  GetGenesisHash = 'getGenesisHash',
}

export const SolanaGetGenesisHashRequestStruct = object({
  method: enums([SolanaProtocolRequestMethod.GetGenesisHash]),
});
