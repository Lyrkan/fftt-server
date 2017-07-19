import { Game } from '../common/model/game';
import { GameStatus } from '../common/statuses/game-status';
import { Logger } from '../common/services/logger';
import { Matchmaker } from './matchmaker';
import { NodeNotFoundError } from './nodes/errors/node-not-found-error';
import { NodeProvider, NodeConfiguration } from './nodes/node-provider';
import { NodeStatus } from '../common/statuses/node-status';
import { Server } from './server';

/**
 * The role of the Coordinator is to manage game nodes.
 * Basically, it creates nodes when needed (new games) and
 * stops them if a game has ended.
 */
export class Coordinator {
  private config: CoordinatorConfiguration;
  private matchmaker: Matchmaker;
  private server: Server;
  private games: Game[];
  private running: boolean;
  private stopRequest: boolean;

  /**
   * Constructor.
   *
   * @param logger   An instance of the logger service
   * @param provider A game provider
   * @param config   Coordinator settings
   */
  public constructor(
    private logger: Logger,
    private provider: NodeProvider<any, NodeConfiguration>,
    config: CoordinatorConfiguration,
  ) {
    this.config = { ...config };
    this.matchmaker = new Matchmaker(logger, provider);
    this.server = new Server(logger, this.matchmaker, config);
    this.games = [];
  }

  /**
   * Start the coordinator loop.
   */
  public async start(): Promise<void> {
    if (this.running) {
      this.logger.debug('Coordinator', 'Coordinator is already running');
      return;
    }

    this.logger.info('Coordinator', 'Starting');

    this.stopRequest = false;
    this.running = true;

    try {
      await this.server.start();
    } catch (e) {
      this.logger.error('Coordinator', `Could not start server: `, e);
      process.exit(255);
    }

    // Keep trying to find games
    while (!this.stopRequest) {
      this.logger.debug('Coordinator', 'Tick');

      // Update game statuses and remove ended games
      await this.updateGameStatuses();

      // Call matchmaker
      await this.matchmake();

      // Wait for next tick
      await new Promise(resolve => setTimeout(resolve, this.config.tickInterval));
    }

    // Stop websocket server
    await this.server.stop();

    this.running = false;
  }

  /**
   * Try to stop the coordinator.
   */
  public async stop(): Promise<void> {
    if (this.stopRequest || !this.running) {
      this.logger.debug('Coordinator', 'Coordinator is already stopped or being stopped');
      return;
    }

    this.logger.info('Coordinator', 'Stopping');

    const stopRequestTimestamp = (new Date()).getTime();

    // Set the stopRequest flag to true
    this.stopRequest = true;

    // Wait for the running flag to be set to false or
    // for the stopTimeout interval to be reached.
    await new Promise((resolve, reject) => {
      const checkInterval = setInterval(_ => {
        const currentTimestamp = (new Date()).getTime();
        const delta = currentTimestamp - stopRequestTimestamp;

        if (!this.running || (delta >= this.config.stopTimeout)) {
          clearInterval(checkInterval);

          if (this.running) {
            reject(new Error(`Coordinator: Stop request timed-out after ${delta}ms`));
          }

          this.logger.info('Coordinator', 'Stopped');
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Update game statuses and remove games matching one
   * of the following criteria:
   * - Node isn't running anymore
   * - Game status is equal to GameStatus.ENDED
   */
  private async updateGameStatuses(): Promise<void> {
    this.logger.debug('Coordinator', 'Update game statuses');

    for (const game of this.games) {
      // Check node status first
      let nodeStatus = NodeStatus.UNKNOWN;

      try {
        const nodeInfo = await this.provider.getNodeInfo(game.nodeId);
        nodeStatus = nodeInfo.status;
      } catch (e) {
        if (e instanceof NodeNotFoundError) {
          this.logger.warn(
            'Coordinator',
            `Node "${game.nodeId} was registered to the coordinator but unknown from the provider`
          );
        } else {
          this.logger.error(
            'Coordinator',
            `Could not retrieve status for node "${game.nodeId}: `,
            e
          );
        }
      }

      if ((NodeStatus.STARTING !== nodeStatus) && (NodeStatus.RUNNING !== nodeStatus)) {
        // Remove nodes that are not running anymore
        this.logger.warn(
          'Coordinator',
          `Status of game "${game.id}" set to "ended" since its node isn't running anymore`
        );
        game.status = GameStatus.ENDED;
      } else if (NodeStatus.RUNNING === nodeStatus) {
        // Update game status
        game.status = GameStatus.UNKNOWN;

        try {
          game.status = await this.provider.getGameStatus(game.nodeId);
        } catch (e) {
          this.logger.warn(
            'Coordinator',
            `Could not retrieve status for game "${game.id}: `,
            e
          );
        }

        if (game.status === GameStatus.ENDED) {
          this.logger.info(
            'Coordinator',
            `Game "${game.id}" ended, shutting down node "${game.nodeId}"`
          );

          // TODO Get game results and persist them

          await this.provider.stopNode(game.nodeId);
        }
      }

      try {
        // Persist new game status
        game.save();
      } catch (e) {
        this.logger.warn(
          'Coordinator',
          `Could not save new status "${game.status}" for game "${game.id}: `,
          e
        );
      }
    }

    // Remove ended games
    this.games = this.games.filter(game => (game.status !== GameStatus.ENDED));
  }

  /**
   * Try to matchmake queueing players.
   */
  private async matchmake(): Promise<void> {
    this.logger.debug('Coordinator', 'Matchmake');
    const newGames = await this.matchmaker.tick();

    this.logger.debug('Coordinator', `${newGames.length} new game(s)`);
    this.games.concat(newGames);
  }
}

export interface CoordinatorConfiguration {
  port: number;
  jwtPublicCert: string;
  tickInterval: number;
  stopTimeout: number;
}
