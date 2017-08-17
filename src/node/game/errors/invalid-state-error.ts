export class InvalidStateError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidStateError.prototype);
  }
}
