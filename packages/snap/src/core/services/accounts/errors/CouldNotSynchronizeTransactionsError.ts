export class CouldNotSynchronizeTransactionsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CouldNotSynchronizeTransactionsError';
  }
}
