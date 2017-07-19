import { GameStatus } from '../../../common/statuses/game-status';
import { NodeInfo } from '../node-info';
import { NodeProvider, NodeConfiguration } from '../node-provider';
import { NodeNotFoundError } from '../errors/node-not-found-error';
import { NodesLimitReachedError } from '../errors/nodes-limit-reached-error';
import { Player } from '../../../common/model/player';

export class DockerProvider extends NodeProvider<string, NodeConfiguration> {
  public async createNode(players: Player[]): Promise<string> {
    if ((this.config.maxNodes > 0) && (this.currentNodes.size >= this.config.maxNodes)) {
      throw new NodesLimitReachedError(this.config.maxNodes);
    }

    throw new Error('DockerProvider is not implemented yet');
  }

  public async stopNode(nodeId: string): Promise<void> {
    if (!this.currentNodes.has(nodeId)) {
      throw new NodeNotFoundError(nodeId);
    }

    throw new Error('DockerProvider is not implemented yet');
  }

  public async getNodeInfo(nodeId: string): Promise<NodeInfo> {
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
