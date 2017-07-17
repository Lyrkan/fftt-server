import * as fs from 'fs';
import * as http from 'http';
import * as socketio from 'socket.io';
import * as socketioJwt from 'socketio-jwt';
import { Game } from './games/game';
import { GameStatus } from '../common/statuses/game-status';
import { Logger } from '../common/services/logger';
import { Matchmaker } from './matchmaker';
import { NodeNotFoundError } from './nodes/errors/node-not-found-error';
import { NodeProvider } from './nodes/node-provider';
import { NodeStatus } from '../common/statuses/node-status';

export class Coordinator {
  private matchmaker: Matchmaker;
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
    private provider: NodeProvider<any>,
    private config: CoordinatorConfiguration,
  ) {
    this.matchmaker = new Matchmaker(logger, provider);
    this.games = [];
  }

  /**
   * Start the coordinator loop.
   */
  public async start(): Promise<void> {
    this.logger.info('Coordinator', 'Starting');

    this.stopRequest = false;
    this.running = true;

    // Start websocket server
    const server = http.createServer();
    const io = socketio(server);

    try {
      const jwtPublicCert = fs.readFileSync(this.config.jwtPublicCert);
      io.sockets.on('connection', socketioJwt.authorize({
        secret: jwtPublicCert
      })).on('authenticated', (socket: { decoded_token: any } & SocketIO.Socket) => {
        this.logger.debug(
          'Coordinator',
          `New client connected: ${JSON.stringify(socket.decoded_token)}`
        );
      });
    } catch (e) {
      this.logger.error('Coordinator', 'Could not initialize JWT handling: ', e);
      process.exit(255);
    }

    try {
      await server.listen(this.config.port);
    } catch (e) {
      this.logger.error('Coordinator', `Could not start server on port ${this.config.port}: `, e);
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
    await new Promise(resolve => {
      if (server.listening) {
        this.logger.info('Coordinator', 'Shutting down server');
        server.close(() => {
          resolve();
        });
      } else {
        this.logger.warn('Coordinator', 'Server was not running');
        resolve();
      }
    });

    this.running = false;
  }

  /**
   * Try to stop the coordinator.
   */
  public async stop(): Promise<void> {
    this.logger.info('Coordinator', 'Stopping');

    const stopRequestTimestamp = (new Date()).getTime();

    // Set the stopRequest flag to true
    this.stopRequest = true;

    // Wait for the running flag to be set to false or
    // for the STOP_TIMEOUT interval to be reached.
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
        nodeStatus = await this.provider.getNodeStatus(game.nodeId);
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
        game.setStatus(GameStatus.ENDED);
      } else if (NodeStatus.RUNNING === nodeStatus) {
        // Update game status
        let gameStatus = GameStatus.UNKNOWN;

        try {
          gameStatus = await this.provider.getGameStatus(game.nodeId);
        } catch (e) {
          this.logger.warn(
            'Coordinator',
            `Could not retrieve status for game "${game.id}: `,
            e
          );
        }

        game.setStatus(gameStatus);

        if (game.getStatus() === GameStatus.ENDED) {
          this.logger.info(
            'Coordinator',
            `Game "${game.id}" ended, shutting down node "${game.nodeId}"`
          );
          await this.provider.stopNode(game.nodeId);
        }
      }
    }

    // Remove ended games
    this.games = this.games.filter(game => (game.getStatus() !== GameStatus.ENDED));
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
