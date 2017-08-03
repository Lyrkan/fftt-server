import { Game } from './model/game';
import { GameStatus } from '../common/statuses/game-status';
import { Logger } from '../common/logger/logger';
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
  private games: Game[];
  private running: boolean;
  private stopRequest: boolean;

  /**
   * Constructor.
   *
   * @param logger     An instance of the logger service
   * @param provider   A game provider
   * @param matchmaker A matchmaker
   * @param server     A SocketIO server
   * @param config     Coordinator settings
   */
  public constructor(
    private logger: Logger,
    private provider: NodeProvider<any, NodeConfiguration>,
    private matchmaker: Matchmaker,
    private server: Server,
    config: CoordinatorConfiguration,
  ) {
    this.config = { ...config };
    this.games = [];
    this.server.setCoordinator(this);
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

    // Set running flags
    this.stopRequest = false;
    this.running = true;

    // Start listening for connections
    await this.server.start();

    // Start the runloop (don't await here)
    this.runLoop();
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
   * Retrieve the game a player is currently
   * into if there is one, null otherwise.
   *
   * @param player Id of the player
   */
  public getGame(playerId: string): Game|null {
    for (const game of this.games) {
      if (game.playerIds.indexOf(playerId) !== -1) {
        return game;
      }
    }

    return null;
  }

  private async runLoop(): Promise<void> {
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
        // Retrieve info about the game and update its status;
        let gameInfo = null;
        game.status = GameStatus.UNKNOWN;

        try {
          gameInfo = await this.provider.getGameInfo(game.nodeId);
          game.status = gameInfo.status;
          // TODO Get game results from gameInfo if available
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
  tickInterval: number;
  stopTimeout: number;
}
