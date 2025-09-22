export abstract class FeeCalculatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeeCalculatorError';
  }
}

export class FeeCalculatorUnsupportedInputTypeError extends FeeCalculatorError {
  constructor(message: string) {
    super(message);
    this.name = 'FeeCalculatorUnsupportedInputTypeError';
  }
}
