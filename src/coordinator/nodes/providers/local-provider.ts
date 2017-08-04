import * as uuid from 'uuid';
import * as os from 'os';
import { GameInfo } from '../../../common/dto/game-info';
import { GameStatus } from '../../../common/statuses/game-status';
import { NodeInfo } from '../../../common/dto/node-info';
import { NodeProvider, NodeConfiguration } from '../node-provider';
import { Node } from '../../../node/node';
import { NodeNotFoundError } from '../errors/node-not-found-error';
import { NodesLimitReachedError } from '../errors/nodes-limit-reached-error';
import { NodeStatus } from '../../../common/statuses/node-status';
import { Player } from '../../model/player';
import { Ruleset } from '../../../common/rules/ruleset';

export class LocalProvider extends NodeProvider<Node, LocalNodeConfiguration> {
  public async createNode(players: Player[], ruleset: Ruleset): Promise<string> {
    if ((this.config.maxNodes > 0) && (this.currentNodes.size >= this.config.maxNodes)) {
      throw new NodesLimitReachedError(this.config.maxNodes);
    }

    const nodeId = uuid.v4();
    const node = new Node(
      this.logger,
      {
        nodeId,
        jwtPublicCert: this.config.jwtPublicCert,
        jwtAlgorithms: this.config.jwtAlgorithms,
        minPort: this.config.minPort,
        maxPort: this.config.maxPort,
        timeout: this.config.nodeTimeout,
        players: players.map(player => ({
          playerId: player._id,
          username: player.username,
          picture: player.picture,
          cards: player.cards,
          rank: player.rank,
        })),
        ruleset,
      }
    );

    this.currentNodes.set(nodeId, node);

    try {
      await node.start();
      return nodeId;
    } catch (e) {
      this.logger.error('LocalProvider', `Could not start node "${nodeId}: `, e);
      this.currentNodes.delete(nodeId);
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
      host: this.config.host || this.getLocalIpAddress(),
      port: node ? node.getPort() : null,
      status: node ? node.getStatus() : NodeStatus.UNKNOWN
    };
  }

  public async getGameInfo(nodeId: string): Promise<GameInfo> {
    if (!this.currentNodes.has(nodeId)) {
      throw new NodeNotFoundError(nodeId);
    }

    const node = this.currentNodes.get(nodeId);
    return node ? node.getGameInfo() : { status: GameStatus.UNKNOWN };
  }

  private getLocalIpAddress(): string|null {
    const interfaces = os.networkInterfaces();
    for (const ifaceName in interfaces) {
      if (interfaces.hasOwnProperty(ifaceName)) {
        for (const ifaceInfo in interfaces[ifaceName]) {
          if (interfaces[ifaceName].hasOwnProperty(ifaceInfo)) {
            const address = interfaces[ifaceName][ifaceInfo];
            if (address.family === 'IPv4' && !address.internal) {
              return address.address;
            }
          }
        }
      }
    }
    return null;
  }
}

export interface LocalNodeConfiguration extends NodeConfiguration {
  host?: string | null;
}
