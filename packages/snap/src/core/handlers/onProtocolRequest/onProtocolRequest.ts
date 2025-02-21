/* eslint-disable no-case-declarations */
import type { OnProtocolRequestHandler } from '@metamask/snaps-sdk';
import { assert } from 'superstruct';

import { connection } from '../../../snapContext';
import { NetworkStruct } from '../../validation/structs';
import {
  SolanaGetGenesisHashRequestStruct,
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

    default:
      throw new Error(`Unsupported method: ${request.method}`);
  }
};
