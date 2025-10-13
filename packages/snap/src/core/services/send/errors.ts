const PERMANENT_LOSS_OF_FUNDS_MESSAGE =
  'Sending to this address may result in permanent loss of funds.';

const VALID_RECIPIENT_MESSAGE =
  'Only wallet addresses and token accounts are supported.';

export class RecipientClassificationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RecipientClassificationError';
  }
}

export class RecipientUnsupportedError extends RecipientClassificationError {
  constructor() {
    super(
      `Cannot send to this address. This appears to be a mint account, program data account, metadata account, or PDA. ${
        PERMANENT_LOSS_OF_FUNDS_MESSAGE
      } ${VALID_RECIPIENT_MESSAGE}`,
    );
    this.name = 'RecipientUnsupportedError';
  }
}

export class RecipientTokenAccountMintMismatchError extends RecipientClassificationError {
  constructor() {
    super(
      `Cannot send to this address. This is a token account for a different token than the one you're trying to send. ${
        PERMANENT_LOSS_OF_FUNDS_MESSAGE
      }`,
    );
    this.name = 'RecipientTokenAccountMintMismatchError';
  }
}
