import * as fs from 'fs';
import * as http from 'http';
import * as socketio from 'socket.io';
import * as socketioJwt from 'socketio-jwt';
import { CardsMap } from '../common/cards/cards';
import { Coordinator } from './coordinator';
import { Game } from '../common/model/game';
import { Logger } from '../common/services/logger/logger';
import { Matchmaker } from './matchmaker';
import { NodeProvider, NodeConfiguration } from './nodes/node-provider';
import { Player, PlayerModel, DEFAULT_RANK } from '../common/model/player';
import { randomCards } from '../common/cards/card-utils';

/**
 * Socket.IO server.
 */
export class Server {
  private config: ServerConfiguration;
  private httpServer: http.Server;
  private ioServer: SocketIO.Server;
  private sockets: Map<string, SocketIO.Socket>;
  private coordinator: Coordinator;

  /**
   * Constructor.
   *
   * @param logger An instance of the logger service
   * @param config Coordinator settings
   */
  public constructor(
    private logger: Logger,
    private matchmaker: Matchmaker,
    private nodeProvider: NodeProvider<any, NodeConfiguration>,
    config: ServerConfiguration,
  ) {
    this.config = { ...config };
    this.httpServer = http.createServer();
    this.ioServer = socketio(this.httpServer);
    this.initialize();
  }

  /**
   * Start the server.
   */
  public async start() {
    this.logger.info('Server', `Starting coordinator server on port "${this.config.port}"`);

    if (this.httpServer.listening) {
      throw new Error(`Server is already running on port ${this.httpServer.address().port}`);
    }

    await new Promise((resolve, reject) => {
      const rejectListener = (e: Error) => { reject(e); };
      this.httpServer
        .on('error', rejectListener)
        .listen(this.config.port, () => {
          this.logger.info('Server', `Server is now listening to port ${this.config.port}`);
          this.httpServer.removeListener('on', rejectListener);
          resolve();
        });
    });
  }

  /**
   * Stop the server.
   */
  public async stop() {
    await new Promise((resolve, reject) => {
      if (this.httpServer && this.httpServer.listening) {
        this.logger.info('Server', 'Stopping coordinator server');
        const rejectListener = (e: Error) => { reject(e); };
        this.httpServer
          .on('error', rejectListener)
          .close(() => {
            this.logger.info('Server', 'Server stopped');
            this.httpServer.removeListener('error', rejectListener);
            resolve();
          });
      } else {
        this.logger.warn('Server', 'Server was not running');
        resolve();
      }
    });
  }

  /**
   * Set the coordinator currently associated to the
   * server.
   *
   * The coordinator can't be injected in the
   * constructor because of the circular reference.
   *
   * @param coordinator An instance of a Coordinator
   */
  public setCoordinator(coordinator: Coordinator) {
    this.coordinator = coordinator;
  }

  /**
   * Initialize the Socket.IO server so it handles
   * JWT authentication.
   */
  private initialize() {
    try {
      const jwtPublicCert = fs.readFileSync(this.config.jwtPublicCert);
      this.ioServer.sockets.on('connection', socketioJwt.authorize({
        secret: jwtPublicCert,
        callback: 10000,
      })).on('authenticated', (socket: { decoded_token: DecodedToken } & SocketIO.Socket) => {
        this.onPlayerAuthenticated(socket, socket.decoded_token);
      });
    } catch (e) {
      this.logger.error('Server', 'Could not initialize JWT handling: ', e);
      throw e;
    }
  }

  /**
   * Called when an authenticated player connects to
   * the server.
   *
   * @param socket       SocketIO Socket
   * @param decodedToken Decoded JWT
   */
  private onPlayerAuthenticated(socket: SocketIO.Socket, decodedToken: DecodedToken): void {
    this.logger.debug(
      'Server',
      `New client connected from ${socket.request.connection.remoteAddress}`
    );

    // Retrieve player ID from JWT
    const playerId = decodedToken.sub;

    if (playerId) {
      // If the user has an id, check if it exists in the database, create it otherwise
      PlayerModel.findById(playerId).then(player => {
        if (!player) {
          // If the player is missing in the db, create it with the default rank
          const newPlayer = new PlayerModel({
            _id: playerId,
            username: decodedToken.username || playerId,
            picture: decodedToken.picture,
            rank: DEFAULT_RANK,
            cards: [],
          });

          newPlayer.save().then(p => {
            this.logger.debug('Server', `Player "${playerId}" did not exist and was created`);
            this.onPlayerRetrieved(socket, p);
          }).catch(e => {
            this.logger.error(
              'Server',
              `An error occured while trying to create new player "${playerId}": `,
              e
            );
            socket.disconnect();
          });
        } else {
          this.logger.debug(
            'Server',
            `Player "${playerId}" was found in the database (rank: ${player.rank})`
          );
          this.onPlayerRetrieved(socket, player);
        }
      });
    } else {
      this.logger.warn(
        'Server',
        `New client didn't have an ID in its token: ${JSON.stringify(decodedToken)}`
      );
      socket.disconnect();
    }
  }

  /**
   * Called when a player is successfully created
   * or retrieved from the database after it connected
   * to the server.
   *
   * @param socket SocketIO Socket
   * @param player Player
   */
  private onPlayerRetrieved(socket: SocketIO.Socket, player: Player): void {
    this.logger.info('Server', `Player "${player._id}" joined the server`);
    this.sockets.set(player._id, socket);

    // Check if the player has cards, or drop some of them
    if (!player.cards.length) {
      this.dropCards(player, 10);
    }

    // TODO Send player info

    // Check if player is already in a game
    if (this.coordinator) {
      const currentGame = this.coordinator.getGame(player._id);
      if (currentGame) {
        this.sendNodeInfo(player, currentGame);
      }
    }

    socket.on('disconnect',  () => this.onPlayerDisconnected(player));
    socket.on('startSearch', () => this.onPlayerStartSearch(player));
    socket.on('stopSearch',  () => this.onPlayerStopSearch(player));
  }

  /**
   * Called when an authenticated player disconnects
   * from the server.
   *
   * @param player Player
   */
  private onPlayerDisconnected(player: Player): void {
    this.logger.info('Server', `Player "${player._id}" disconnected`);
    this.matchmaker.removePlayer(player._id);
    this.sockets.delete(player._id);
  }

  /**
   * Called when a player starts searching for a game.
   *
   * @param player Player
   */
  private onPlayerStartSearch(player: Player): void {
    this.logger.debug('Server', `Player "${player._id}" started searching for a game`);
    this.matchmaker.addPlayer(player._id, (game: Game) => {
      this.logger.debug(
        'Server',
        `Found a game for player "${player._id}": "${game._id}" on node "${game.nodeId}"`
      );

      this.sendNodeInfo(player, game);
    });
  }

  /**
   * Called when a player stops searching for a game.
   *
   * @param player Player
   */
  private onPlayerStopSearch(player: Player): void {
    this.logger.debug('Server', `Player "${player._id}" stopped searching for a game`);
    this.matchmaker.removePlayer(player._id);
  }

  /**
   * Retrieve information about the node a game is
   * running on and send them to a player.
   *
   * @param player Player
   * @param game   Active game
   */
  private async sendNodeInfo(player: Player, game: Game): Promise<void> {
    this.logger.debug(
      'Server',
      `Sending node info to player "${player._id}" for game "${game._id}"`
    );

    const socket = this.sockets.get(player._id);
    try {
      if (!socket) {
        throw new Error('Player is not associated to any active socket');
      }

      // Retrieve node info from provider and send it to the player
      socket.emit(
        'nodeInfo',
        await this.nodeProvider.getNodeInfo(game.nodeId),
      );
    } catch (e) {
      this.logger.debug(
        'Server',
        `Could not send game information to player "${player._id}": `,
        e
      );
    }
  }

  /**
   * Give random cards to a player.
   *
   * @param player Player
   * @param count  Number of cards to give to the player
   */
  private async dropCards(player: Player, count: number = 1): Promise<void> {
    this.logger.debug('Server', `Dropping ${count} cards for player "${player._id}"`);

    const newCards = randomCards(count);
    try {
      player.cards = player.cards.concat(newCards);
      await player.save();

      const socket = this.sockets.get(player._id);
      if (socket) {
        socket.emit('newCards', newCards.map(cardId => CardsMap.get(cardId)));
      }
    } catch (e) {
      this.logger.error(
        'Server',
        `Could not drop cards for player "${player._id}": `,
        e
      );
    }
  }
}

export interface ServerConfiguration {
  port: number;
  jwtPublicCert: string;
}

interface DecodedToken {
  sub: string;
  username?: string;
  picture?: string;
}
