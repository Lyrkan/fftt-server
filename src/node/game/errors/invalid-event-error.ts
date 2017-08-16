export class InvalidEventError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidEventError.prototype);
  }
}
