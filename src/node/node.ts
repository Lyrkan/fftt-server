import { GameStatus } from '../common/statuses/game-status';
import { Logger } from '../common/services/logger';
import { NodeStatus } from '../common/statuses/node-status';
import { Player } from '../common/model/player';

export class Node {
  private status: NodeStatus;

  /**
   * Constructor.
   *
   * @param logger An instance of the logger service
   * @param config Node settings
   */
  public constructor(private logger: Logger, private config: NodeConfiguration) {
    this.status = NodeStatus.STOPPED;
  }

  /**
   * Start the node.
   */
  public async start(): Promise<void> {
    this.logger.info('Node', `Starting node "${this.getNodeId()}"`);
    this.status = NodeStatus.STARTING;

    // TODO

    this.status = NodeStatus.RUNNING;
  }

  /**
   * Stop the node.
   */
  public async stop(): Promise<void> {
    this.logger.info('Node', `Stopping node "${this.getNodeId()}"`);
    this.status = NodeStatus.STOPPING;

    // TODO

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
   * Return the status of the game.
   */
  public getGameStatus(): GameStatus {
    // TODO
    return GameStatus.UNKNOWN;
  }

  /**
   * Return the port the node is listening to.
   */
  public getPort(): number|null {
    // TODO
    return null;
  }
}

export interface NodeConfiguration {
  nodeId: string,
  jwtPublicCert: string;
  minPort: number;
  maxPort: number;
  players: Player[];
}
