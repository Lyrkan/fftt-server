export class UnreachableNodeError extends Error {
  constructor(nodeId: string) {
    super(`Node "${nodeId}" could not be reached`);
    Object.setPrototypeOf(this, UnreachableNodeError.prototype);
  }
}
