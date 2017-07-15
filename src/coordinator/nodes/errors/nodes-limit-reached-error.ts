export class NodesLimitReachedError extends Error {
  constructor(maxNodes: number) {
    super(`The maximum number of nodes has been reached (${maxNodes})`);
    Object.setPrototypeOf(this, NodesLimitReachedError.prototype);
  }
}
