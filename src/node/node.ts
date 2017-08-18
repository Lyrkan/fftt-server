import { GameInfo } from '../common/dto/game-info';
import { GameStateManager } from './game/game-state-manager';
import { LoggerInterface } from '../common/logger/logger';
import { NodeStatus } from '../common/statuses/node-status';
import { Server } from './server';

/**
 * Game node
 */
export class Node {
  private config: NodeConfiguration;
  private status: NodeStatus;
  private nodeTimeout: NodeJS.Timer|null;

  /**
   * Constructor.
   *
   * @param logger           An instance of the logger service
   * @param server           An instance of the server
   * @param gameStateManager An instance of the game state manager service
   * @param config           Node settings
   */
  public constructor(
    private logger: LoggerInterface,
    private server: Server,
    private gameStateManager: GameStateManager,
    config: NodeConfiguration
  ) {
    this.config = { ...config };
    this.status = NodeStatus.STOPPED;
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
  timeout: number;
}
