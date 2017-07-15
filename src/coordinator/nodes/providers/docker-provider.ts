import { GameStatus } from '../../../common/statuses/game-status';
import { Logger } from '../../../common/services/logger';
import { NodeProvider, NodeConfiguration } from '../node-provider';
import { NodeStatus } from '../../../common/statuses/node-status';
import { NodeNotFoundError } from '../errors/node-not-found-error';
import { NodesLimitReachedError } from '../errors/nodes-limit-reached-error';

export class LocalProvider extends NodeProvider<string> {
  public constructor(logger: Logger, config: NodeConfiguration) {
    super(logger, config);
  }

  public async createNode(playerIds: string[]): Promise<string> {
    if ((this.maxNodes > 0) && (this.currentNodes.size >= this.maxNodes)) {
      throw new NodesLimitReachedError(this.maxNodes);
    }

    throw new Error('DockerProvider is not implemented yet');
  }

  public async stopNode(nodeId: string): Promise<void> {
    if (!this.currentNodes.has(nodeId)) {
      throw new NodeNotFoundError(nodeId);
    }

    throw new Error('DockerProvider is not implemented yet');
  }

  public async getNodeStatus(nodeId: string): Promise<NodeStatus> {
    if (!this.currentNodes.has(nodeId)) {
      throw new NodeNotFoundError(nodeId);
    }

    throw new Error('DockerProvider is not implemented yet');
  }

  public async getGameStatus(nodeId: string): Promise<GameStatus> {
    if (!this.currentNodes.has(nodeId)) {
      throw new NodeNotFoundError(nodeId);
    }

    throw new Error('DockerProvider is not implemented yet');
  }
}
