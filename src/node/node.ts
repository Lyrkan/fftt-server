import { GameInfo } from '../common/dto/game-info';
import { GameStateManager } from './game/game-state-manager';
import { LoggerDecorator } from './logger/logger-decorator';
import { LoggerInterface } from '../common/logger/logger';
import { NodeStatus } from '../common/statuses/node-status';
import { PlayerInfo } from '../common/dto/player-info';
import { Ruleset } from '../common/rules/ruleset';
import { Server } from './server';

/**
 * Game node
 */
export class Node {
  private logger: LoggerInterface;
  private config: NodeConfiguration;
  private gameStateManager: GameStateManager;
  private server: Server;
  private status: NodeStatus;
  private nodeTimeout: NodeJS.Timer|null;

  /**
   * Constructor.
   *
   * @param logger An instance of the logger service
   * @param config Node settings
   */
  public constructor(logger: LoggerInterface, config: NodeConfiguration) {
    this.config = { ...config };
    this.status = NodeStatus.STOPPED;

    // TODO Instanciate the logger elsewhere
    this.logger = new LoggerDecorator(logger, config.nodeId);

    // TODO Instanciate the server elsewhere
    this.server = new Server(this.logger, {
      jwtPublicCert: this.config.jwtPublicCert,
      jwtAlgorithms: this.config.jwtAlgorithms,
      minPort: this.config.minPort,
      maxPort: this.config.maxPort,
    });

    // TODO Instanciate the game state manager elsewhere
    this.gameStateManager = new GameStateManager(this.logger, this.server, {
      players: this.config.players,
      ruleset: this.config.ruleset,
    });
  }

  /**
   * Start the node.
   */
  public async start(): Promise<void> {
    if (this.status !== NodeStatus.STOPPED) {
      this.logger.debug('Node', 'Node is already running');
      return;
    }

    this.logger.info('Node', 'Starting node');
    this.status = NodeStatus.STARTING;

    try {
      await this.server.start();
      this.logger.info('Node', 'Node is now running');
      this.status = NodeStatus.RUNNING;
      this.startNodeTimeoutCheck();
    } catch (e) {
      this.logger.error('Node', 'Could not start server: ', e);
      this.status = NodeStatus.UNKNOWN;
    }
  }

  /**
   * Stop the node.
   */
  public async stop(): Promise<void> {
    if (this.status !== NodeStatus.RUNNING) {
      this.logger.debug('Node', `Node is not running`);
      return;
    }

    this.logger.info('Node', `Stopping node`);
    this.stopNodeTimeoutCheck();
    this.status = NodeStatus.STOPPING;

    try {
      await this.server.stop();
      this.logger.info('Node', `Node is now stopped`);
      this.status = NodeStatus.STOPPED;
    } catch (e) {
      this.logger.error('Node', 'Could not stop server: ', e);
      this.status = NodeStatus.UNKNOWN;
    }
  }

  /**
   * Return the ID of the this node.
   */
  public getNodeId(): string {
    return this.config.nodeId;
  }

  /**
   * Return the current status of this node.
   */
  public getStatus(): NodeStatus {
    return this.status;
  }

  /**
   * Return some info about the game.
   */
  public getGameInfo(): GameInfo {
    const gameState = this.gameStateManager.getGameState();
    return {
      status: gameState.getStatus(),
    };
  }

  /**
   * Return the port the node is listening to or
   * null if there isn't one.
   */
  public getPort(): number|null {
    return this.server.getPort();
  }

  /**
   * Start a timer that checks if the node has
   * been running for too long and stops it if
   * that's the case.
   */
  private startNodeTimeoutCheck(): void {
    // Stop previous node timeout
    this.stopNodeTimeoutCheck();

    // Start a new timer
    this.nodeTimeout = setTimeout(() => {
      this.logger.debug(
        'Node',
        `Shutting down node (${this.config.timeout}s timeout reached)`
      );
      this.nodeTimeout = null;
      this.stop();
    }, this.config.timeout);
  }

  /**
   * Stop the current node timeout check if
   * there's one.
   */
  private stopNodeTimeoutCheck(): void {
    // If there is a current node timeout, stop it
    if (this.nodeTimeout) {
      clearTimeout(this.nodeTimeout);
      this.nodeTimeout = null;
    }
  }
}

export interface NodeConfiguration {
  readonly nodeId: string;
  jwtPublicCert: string;
  jwtAlgorithms: string[];
  minPort: number;
  maxPort: number;
  players: PlayerInfo[];
  ruleset: Ruleset;
  timeout: number;
}
