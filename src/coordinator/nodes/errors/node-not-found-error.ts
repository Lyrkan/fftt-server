export class NodeNotFoundError extends Error {
  constructor(nodeId: string) {
    super(`Node "${nodeId}" could not be found`);
    Object.setPrototypeOf(this, NodeNotFoundError.prototype);
  }
}
