import * as uuid from 'uuid';
import { GameStatus } from '../../../common/statuses/game-status';
import { Logger } from '../../../common/services/logger';
import { NodeProvider, NodeConfiguration } from '../node-provider';
import { Node } from '../../../node/node';
import { NodeStatus } from '../../../common/statuses/node-status';
import { NodeNotFoundError } from '../errors/node-not-found-error';
import { NodesLimitReachedError } from '../errors/nodes-limit-reached-error';

export class LocalProvider extends NodeProvider<Node> {
  private minPort: number;
  private maxPort: number;

  public constructor(logger: Logger, config: LocalNodeConfiguration) {
    super(logger, config);

    this.minPort = Math.min(config.minPort, config.maxPort);
    this.maxPort = Math.max(config.maxPort, config.minPort);
    this.maxNodes = Math.min(this.maxNodes, (this.maxPort - this.minPort));
  }

  public async createNode(playerIds: string[]): Promise<string> {
    if ((this.maxNodes > 0) && (this.currentNodes.size >= this.maxNodes)) {
      throw new NodesLimitReachedError(this.maxNodes);
    }

    const node = new Node(this.logger, uuid.v4(), playerIds);
    this.currentNodes.set(node.id, node);

    try {
      await node.start();
      return node.id;
    } catch (e) {
      this.logger.error('LocalProvider', `Could not start node "${node.id}: `, e);
      this.currentNodes.delete(node.id);
      throw e;
    }
  }

  public async stopNode(nodeId: string): Promise<void> {
    if (!this.currentNodes.has(nodeId)) {
      throw new NodeNotFoundError(nodeId);
    }

    try {
      const node = this.currentNodes.get(nodeId);
      if (node) {
        await node.stop();
      }
    } catch (e) {
      this.logger.error('LocalProvider', `Could not stop node "${nodeId}": `, e);
      throw e;
    } finally {
      this.currentNodes.delete(nodeId);
    }
  }

  public async getNodeStatus(nodeId: string): Promise<NodeStatus> {
    if (!this.currentNodes.has(nodeId)) {
      throw new NodeNotFoundError(nodeId);
    }

    const node = this.currentNodes.get(nodeId);
    return node ? node.getStatus() : NodeStatus.UNKNOWN;
  }

  public async getGameStatus(nodeId: string): Promise<GameStatus> {
    if (!this.currentNodes.has(nodeId)) {
      throw new NodeNotFoundError(nodeId);
    }

    const node = this.currentNodes.get(nodeId);
    return node ? node.getGameStatus() : GameStatus.UNKNOWN;
  }
}

export interface LocalNodeConfiguration extends NodeConfiguration {
  minPort: number;
  maxPort: number;
}
