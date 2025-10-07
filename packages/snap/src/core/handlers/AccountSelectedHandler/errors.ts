export class AccountSelectedHandlerError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message);
    this.name = 'AccountSelectedHandlerError';
  }
}

export class InvalidRequestError extends AccountSelectedHandlerError {
  constructor(options?: ErrorOptions) {
    super('Invalid request', options);
    this.name = 'InvalidRequestError';
  }
}

export class AccountNotFoundError extends AccountSelectedHandlerError {
  constructor() {
    super('Account not found');
    this.name = 'AccountNotFoundError';
  }
}
