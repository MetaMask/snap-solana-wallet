/* eslint-disable no-case-declarations */

import type { OnProtocolRequestHandler } from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';

import { connection } from '../../../snapContext';
import { NetworkStruct } from '../../validation/structs';
import {
  SolanaGetGenesisHashRequestStruct,
  SolanaGetLatestBlockhashRequestStruct,
  SolanaProtocolRequestMethod,
} from './structs';

export const onProtocolRequest: OnProtocolRequestHandler = async ({
  scope,
  request,
}) => {
  assert(scope, NetworkStruct);

  switch (request.method) {
    case SolanaProtocolRequestMethod.GetGenesisHash:
      assert(request, SolanaGetGenesisHashRequestStruct);
      return connection.getRpc(scope).getGenesisHash().send();

    case SolanaProtocolRequestMethod.GetLatestBlockhash:
      assert(request, SolanaGetLatestBlockhashRequestStruct);
      const latestBlockhash = await connection
        .getRpc(scope)
        .getLatestBlockhash()
        .send();
      return latestBlockhash.value.blockhash;

    default:
      throw new Error(`Unsupported method: ${request.method}`);
  }
};
