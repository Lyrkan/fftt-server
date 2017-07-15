import { GameStatus } from '../../common/statuses/game-status';
import { Logger } from '../../common/services/logger';
import { NodeStatus } from '../../common/statuses/node-status';

export abstract class NodeProvider<T> {
  protected currentNodes: Map<string, T>;
  protected maxNodes: number;

  public constructor(protected logger: Logger, config: NodeConfiguration) {
    this.currentNodes = new Map<string, T>();
    this.maxNodes = config.maxNodes;
  }

  public abstract async createNode(playerIds: string[]): Promise<string>;
  public abstract async stopNode(nodeId: string): Promise<void>;
  public abstract async getNodeStatus(nodeId: string): Promise<NodeStatus>;
  public abstract async getGameStatus(nodeId: string): Promise<GameStatus>;
}

export interface NodeConfiguration {
  maxNodes: number;
}
