import { GameInfo } from '../common/dto/game-info';
import { GameStatus } from '../common/statuses/game-status';
import { Logger } from '../common/logger/logger';
import { NodeStatus } from '../common/statuses/node-status';
import { PlayerInfo } from '../common/dto/player-info';
import { Ruleset } from '../common/rules/ruleset';

export class Node {
  private config: NodeConfiguration;
  private status: NodeStatus;
  private nodeTimeout?: NodeJS.Timer|null;

  /**
   * Constructor.
   *
   * @param logger An instance of the logger service
   * @param config Node settings
   */
  public constructor(private logger: Logger, config: NodeConfiguration) {
    this.config = { ...config };
    this.status = NodeStatus.STOPPED;
  }

  /**
   * Start the node.
   */
  public async start(): Promise<void> {
    if (this.status !== NodeStatus.STOPPED) {
      this.logger.debug('Node', `Node "${this.getNodeId()}" is already running`);
      return;
    }

    this.logger.info('Node', `Starting node "${this.getNodeId()}"`);
    this.status = NodeStatus.STARTING;

    // TODO

    this.logger.info('Node', `Node "${this.getNodeId()}" is now running`);
    this.status = NodeStatus.RUNNING;
    this.startNodeTimeoutCheck();
  }

  /**
   * Stop the node.
   */
  public async stop(): Promise<void> {
    if (this.status !== NodeStatus.RUNNING) {
      this.logger.debug('Node', `Node "${this.getNodeId()}" is not running`);
      return;
    }

    this.logger.info('Node', `Stopping node "${this.getNodeId()}"`);
    this.stopNodeTimeoutCheck();
    this.status = NodeStatus.STOPPING;

    // TODO

    this.logger.info('Node', `Node "${this.getNodeId()}" is now stopped`);
    this.status = NodeStatus.STOPPED;
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
    return {
      status: GameStatus.UNKNOWN,
    };
  }

  /**
   * Return the port the node is listening to.
   */
  public getPort(): number|null {
    // TODO
    return null;
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
        `Shutting down node ${this.getNodeId()} (${this.config.timeout}s timeout reached)`
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
  minPort: number;
  maxPort: number;
  players: PlayerInfo[];
  ruleset: Ruleset;
  timeout: number;
}
