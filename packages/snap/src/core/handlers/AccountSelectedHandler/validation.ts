import { literal, object } from '@metamask/superstruct';
import { JsonRpcIdStruct, JsonRpcVersionStruct } from '@metamask/utils';

import { UuidStruct } from '../../validation/structs';
import { AccountSelectedHandlerMethod } from './types';

export const OnAccountSelectedRequestStruct = object({
  jsonrpc: JsonRpcVersionStruct,
  id: JsonRpcIdStruct,
  method: literal(AccountSelectedHandlerMethod.OnAccountSelected),
  params: object({
    account: UuidStruct,
  }),
});

export const OnAccountUnselectedRequestStruct = object({
  jsonrpc: JsonRpcVersionStruct,
  id: JsonRpcIdStruct,
  method: literal(AccountSelectedHandlerMethod.OnAccountUnselected),
  params: object({
    account: UuidStruct,
  }),
});
