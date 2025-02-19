import { enums, object } from 'superstruct';

export enum SolanaProtocolRequestMethod {
  GetGenesisHash = 'getGenesisHash',
}

export const SolanaGetGenesisHashRequestStruct = object({
  method: enums([SolanaProtocolRequestMethod.GetGenesisHash]),
});
