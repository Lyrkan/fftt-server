import * as uuid from 'uuid';
import { GameInfo } from '../../../common/dto/game-info';
import { GameStatus } from '../../../common/statuses/game-status';
import { LoggerInterface } from '../../../common/logger/logger';
import { NodeInfo } from '../../../common/dto/node-info';
import { NodeProvider, NodeConfiguration } from '../node-provider';
import { NodeNotFoundError } from '../errors/node-not-found-error';
import { NodeStatus } from '../../../common/statuses/node-status';
import { Player } from '../../model/player';
import { Ruleset } from '../../../common/rules/ruleset';

export class NullProvider extends NodeProvider<string, NodeConfiguration> {
  public constructor(logger: LoggerInterface) {
    super(logger, {
      jwtPublicCert: '',
      jwtAlgorithms: ['RS256'],
      minPort: 8000,
      maxPort: 8000,
      maxNodes: 0,
      nodeTimeout: 600000,
    });
  }

  public async createNode(players: Player[], ruleset: Ruleset): Promise<string> {
    const nodeId = uuid.v4();
    this.currentNodes.set(nodeId, nodeId);
    return nodeId;
  }

  public async stopNode(nodeId: string): Promise<void> {
    if (!this.currentNodes.has(nodeId)) {
      throw new NodeNotFoundError(nodeId);
    }

    this.currentNodes.delete(nodeId);
  }

  public async getNodeInfo(nodeId: string): Promise<NodeInfo> {
    if (!this.currentNodes.has(nodeId)) {
      throw new NodeNotFoundError(nodeId);
    }

    return {
      host: null,
      port: null,
      nodeId,
      status: NodeStatus.UNKNOWN,
    };
  }

  public async getGameInfo(nodeId: string): Promise<GameInfo> {
    if (!this.currentNodes.has(nodeId)) {
      throw new NodeNotFoundError(nodeId);
    }

    return {
      status: GameStatus.UNKNOWN
    };
  }
}
