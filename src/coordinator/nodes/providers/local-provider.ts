import * as uuid from 'uuid';
import * as os from 'os';
import { CardsManager } from '../../../common/cards/cards-manager';
import { GameInfo } from '../../../common/dto/game-info';
import { GameStateManager } from '../../../node/game/game-state-manager';
import { GameStatus } from '../../../common/statuses/game-status';
import { LoggerDecorator } from '../../../common/logger/logger-decorator';
import { LoggerInterface } from '../../../common/logger/logger';
import { NodeInfo } from '../../../common/dto/node-info';
import { NodeProvider, NodeConfiguration } from '../node-provider';
import { Node } from '../../../node/node';
import { NodeNotFoundError } from '../errors/node-not-found-error';
import { NodesLimitReachedError } from '../errors/nodes-limit-reached-error';
import { NodeStatus } from '../../../common/statuses/node-status';
import { Player } from '../../model/player';
import { Ruleset } from '../../../common/rules/ruleset';
import { Server } from '../../../node/server';

export class LocalProvider extends NodeProvider<Node, LocalNodeConfiguration> {
  private cardsManager: CardsManager;

  /**
   * Constructor.
   *
   * @param logger       An instance of the logger service
   * @param cardsManager An instance of the cards manager service
   * @param config       Settings for this node provider
   */
  public constructor(
    logger: LoggerInterface,
    cardsManager: CardsManager,
    config: LocalNodeConfiguration
  ) {
    super(logger, config);
    this.cardsManager = cardsManager;
  }

  /**
   * @inheritdoc
   */
  public async createNode(players: Player[], ruleset: Ruleset): Promise<string> {
    if ((this.config.maxNodes > 0) && (this.currentNodes.size >= this.config.maxNodes)) {
      throw new NodesLimitReachedError(this.config.maxNodes);
    }

    // Generate a new node ID
    const nodeId = uuid.v4();

    // Each node will have a decorated logger in order to display its ID
    const logger = new LoggerDecorator(this.logger, category => `${nodeId} - ${category}`);

    // Create a Socket.IO server
    const nodeServer = new Server(logger, {
      jwtPublicCert: this.config.jwtPublicCert,
      jwtAlgorithms: this.config.jwtAlgorithms,
      minPort: this.config.minPort,
      maxPort: this.config.maxPort,
    });

    // Create the service that holds the game state
    const gameStateManager = new GameStateManager(logger, nodeServer, this.cardsManager, {
      players: players.map(player => ({
        playerId: player.playerId,
        username: player.username,
        picture: player.picture,
        cards: player.cards,
        rank: player.rank,
      })),
      ruleset,
    });

    // Create the node
    const node = new Node(logger, nodeServer, gameStateManager, {
      nodeId,
      timeout: this.config.nodeTimeout,
    });

    // Register the node
    this.currentNodes.set(nodeId, node);

    // Start node
    try {
      await node.start();
      return nodeId;
    } catch (e) {
      this.logger.error('LocalProvider', `Could not start node "${nodeId}: `, e);
      this.currentNodes.delete(nodeId);
      throw e;
    }
  }

  /**
   * @inheritdoc
   */
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

  /**
   * @inheritdoc
   */
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

  /**
   * @inheritdoc
   */
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
