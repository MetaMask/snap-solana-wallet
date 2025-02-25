import type { ILogger } from '../../utils/logger';
import logger from '../../utils/logger';

export class SegmentApiClient {
  readonly #fetch: typeof globalThis.fetch;

  readonly #logger: ILogger;

  constructor(
    _fetch: typeof globalThis.fetch = globalThis.fetch,
    _logger: ILogger = logger,
  ) {
    this.#fetch = _fetch;
    this.#logger = _logger;
  }

  async track(event: string, properties: Record<string, unknown>) {
    try {
      await this.#fetch('https://api.segment.io/v1/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          ...properties,
          writeKey: 'c3nvbhRzuZWwUw9Swjq8qZmv5Hw9EiGM',
        }),
      });
    } catch (error) {
      console.log(JSON.stringify(error));
      this.#logger.error('Error tracking event', { error });
    }
  }
}
