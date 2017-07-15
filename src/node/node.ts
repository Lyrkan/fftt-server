import { GameState } from './game-state';
import { GameStatus } from '../common/statuses/game-status';
import { Logger } from '../common/services/logger';
import { NodeStatus } from '../common/statuses/node-status';

export class Node {
  private status: NodeStatus;
  private gameState: GameState;

  public constructor(
    private logger: Logger,
    public readonly id: string,
    public readonly playerIds: string[],
  ) {
    this.status = NodeStatus.STOPPED;
    this.gameState = new GameState();
  }

  /**
   * Start the node.
   */
  public async start(): Promise<void> {
    this.logger.info('Node', `Starting node "${this.id}"`);
    this.status = NodeStatus.STARTING;

    // TODO

    this.status = NodeStatus.RUNNING;
  }

  /**
   * Stop the node.
   */
  public async stop(): Promise<void> {
    this.logger.info('Node', `Stopping node "${this.id}"`);
    this.status = NodeStatus.STOPPING;

    // TODO

    this.status = NodeStatus.STOPPED;
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
    return this.gameState.getGameStatus();
  }
}
