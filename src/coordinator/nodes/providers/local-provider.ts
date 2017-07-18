import * as uuid from 'uuid';
import { GameStatus } from '../../../common/statuses/game-status';
import { Logger } from '../../../common/services/logger';
import { NodeInfo } from '../node-info';
import { NodeProvider, NodeConfiguration } from '../node-provider';
import { Node } from '../../../node/node';
import { NodeNotFoundError } from '../errors/node-not-found-error';
import { NodesLimitReachedError } from '../errors/nodes-limit-reached-error';
import { NodeStatus } from '../../../common/statuses/node-status';
import { Player } from '../../../common/model/player';

export class LocalProvider extends NodeProvider<Node> {

  public constructor(logger: Logger, config: NodeConfiguration) {
    super(logger, config);
  }

  public async createNode(players: Player[]): Promise<string> {
    if ((this.maxNodes > 0) && (this.currentNodes.size >= this.maxNodes)) {
      throw new NodesLimitReachedError(this.maxNodes);
    }

    const node = new Node(this.logger, uuid.v4(), players);
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

  public async getNodeInfo(nodeId: string): Promise<NodeInfo> {
    if (!this.currentNodes.has(nodeId)) {
      throw new NodeNotFoundError(nodeId);
    }

    const node = this.currentNodes.get(nodeId);
    return {
      nodeId,
      host: '127.0.0.1', // TODO Retrieve IP or host
      port: 8081, // TODO Retrieve port
      status: node ? node.getStatus() : NodeStatus.UNKNOWN
    };
  }

  public async getGameStatus(nodeId: string): Promise<GameStatus> {
    if (!this.currentNodes.has(nodeId)) {
      throw new NodeNotFoundError(nodeId);
    }

    const node = this.currentNodes.get(nodeId);
    return node ? node.getGameStatus() : GameStatus.UNKNOWN;
  }
}
