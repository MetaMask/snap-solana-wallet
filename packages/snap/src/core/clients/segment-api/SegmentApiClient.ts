import { assert } from '@metamask/superstruct';

import type { ConfigProvider } from '../../services/config/ConfigProvider';
import { UrlStruct } from '../../validation/structs';

export class SegmentApiClient {
  readonly #fetch: typeof globalThis.fetch;

  readonly #baseUrl: string;

  readonly #writeKey: string;

  constructor(
    configProvider: ConfigProvider,
    _fetch: typeof globalThis.fetch = globalThis.fetch,
  ) {
    const { baseUrl, writeKey } = configProvider.get().segmentApi;

    assert(baseUrl, UrlStruct);

    this.#fetch = _fetch;
    this.#baseUrl = baseUrl;
    this.#writeKey = writeKey;
  }

  async track(params: { anonymousId: string; event: string }) {
    await this.#fetch(`${this.#baseUrl}/v1/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.#writeKey}`,
      },
      body: JSON.stringify({
        ...params,
      }),
    });
  }
}
