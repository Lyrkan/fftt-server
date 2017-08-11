import * as fs from 'fs';
import * as socketioJwt from 'socketio-jwt';
import { AbstractServer, DecodedToken } from '../common/server/abstract-server';
import { CardsManager } from '../common/cards/cards-manager';
import { Coordinator } from './coordinator';
import { Game } from './model/game';
import { LoggerInterface } from '../common/logger/logger';
import { Matchmaker } from './matchmaker';
import { NodeProvider, NodeConfiguration } from './nodes/node-provider';
import { Player, PlayerModel, DEFAULT_RANK } from './model/player';
import { PlayerInfo } from '../common/dto/player-info';
import { randomCards } from '../common/cards/card-utils';

/**
 * Socket.IO server.
 */
export class Server extends AbstractServer {
  private config: ServerConfiguration;
  private coordinator?: Coordinator;

  /**
   * Constructor.
   *
   * @param matchmaker   An instance of the matchmaker service
   * @param nodeProvider An instance of a node provider
   * @param cardsManager An instance of a cards manager
   * @param logger       An instance of the logger service
   * @param config       Server settings
   */
  public constructor(
    private matchmaker: Matchmaker,
    private nodeProvider: NodeProvider<any, NodeConfiguration>,
    private cardsManager: CardsManager,
    logger: LoggerInterface,
    config: ServerConfiguration,
  ) {
    super(logger);
    this.config = { ...config };
    this.initialize();
  }

  /**
   * @inheritdoc
   */
  public async start(): Promise<void> {
    this.logger.info('Server', `Starting server on port "${this.config.port}"`);

    if (this.httpServer.listening) {
      throw new Error(`Server is already running on port ${this.getPort()}`);
    }

    await new Promise((resolve, reject) => {
      const rejectListener = (e: Error) => {
        this.httpServer.removeListener('error', rejectListener);
        reject(e);
      };

      this.httpServer
        .on('error', rejectListener)
        .listen(this.config.port, () => {
          this.logger.info('Server', `Server is now listening to port ${this.config.port}`);
          this.httpServer.removeListener('error', rejectListener);
          resolve();
        });
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
  public setCoordinator(coordinator: Coordinator): this {
    this.coordinator = coordinator;
    return this;
  }

  /**
   * Initialize the Socket.IO server so it handles
   * JWT authentication.
   */
  private initialize(): void {
    try {
      const jwtPublicCert = fs.readFileSync(this.config.jwtPublicCert);
      this.ioServer.sockets.on('connection', socketioJwt.authorize({
        secret: jwtPublicCert,
        callback: 10000,
        algorithms: this.config.jwtAlgorithms,
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
      PlayerModel.findOne({ playerId }).then(player => {
        if (!player) {
          // If the player is missing in the db, create it with the default rank
          const newPlayer = new PlayerModel({
            playerId,
            username: decodedToken.username || playerId,
            picture: decodedToken.picture || null,
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
            socket.disconnect(true);
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
      socket.disconnect(true);
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
    this.logger.info('Server', `Player "${player.playerId}" joined the server`);

    // Disconnect old socket if there is one
    const oldSocket = this.sockets.get(player.playerId);
    if (oldSocket) {
      oldSocket.disconnect(true);
    }

    // Register new socket
    this.sockets.set(player.playerId, socket);

    // Check if the player has cards, or drop some of them
    if (!player.cards.length) {
      this.logger.debug('Server', `Player "${player.playerId}" has no card yet`);
      this.dropCards(player, 10);
    }

    // Send player info
    this.sendPlayerOwnInfo(player);

    // Check if player is already in a game
    if (this.coordinator) {
      const currentGame = this.coordinator.getGame(player.playerId);
      if (currentGame) {
        this.logger.debug('Server', `Player "${player.playerId}" is already in a game`);
        this.sendNodeInfo(player, currentGame);
      }
    } else {
      this.logger.error(
        'Server',
        `Can't check if the player is already in a game because the coordinator isn't available`
      );
    }

    socket.on('disconnect',  () => this.onPlayerDisconnected(socket, player));
    socket.on('startSearch', () => this.onPlayerStartSearch(player));
    socket.on('stopSearch',  () => this.onPlayerStopSearch(player));
  }

  /**
   * Called when an authenticated player disconnects
   * from the server.
   *
   * @param player Player
   */
  private onPlayerDisconnected(socket: SocketIO.Socket, player: Player): void {
    // Only do something if this is the current socket for this player
    const currentPlayerSocket = this.sockets.get(player.playerId);
    if (currentPlayerSocket && (socket === currentPlayerSocket)) {
      this.logger.info('Server', `Player "${player.playerId}" disconnected`);
      this.matchmaker.removePlayer(player.playerId);
      this.sockets.delete(player.playerId);
    }
  }

  /**
   * Called when a player starts searching for a game.
   *
   * @param player Player
   */
  private onPlayerStartSearch(player: Player): void {
    if (!this.coordinator) {
      this.logger.error(
        'Server',
        `Can't search for a game because the coordinator isn't available`
      );
      return;
    }

    const currentGame = this.coordinator.getGame(player.playerId);
    if (currentGame) {
      this.logger.debug(
        'Server',
        `Player "${player.playerId}" tried to search for a game but is already in one`
      );
      this.sendNodeInfo(player, currentGame);
      return;
    }

    this.logger.debug('Server', `Player "${player.playerId}" started searching for a game`);
    this.matchmaker.addPlayer(player.playerId, (game: Game) => {
      this.logger.debug(
        'Server',
        `Found a game for player "${player.playerId}": "${game.id}" on node "${game.nodeId}"`
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
    this.logger.debug('Server', `Player "${player.playerId}" stopped searching for a game`);
    this.matchmaker.removePlayer(player.playerId);
  }

  /**
   * Send a player its information.
   *
   * @param player Player
   */
  private sendPlayerOwnInfo(player: Player): void {
    this.logger.debug(
      'Server',
      `Sending own info to player "${player.playerId}"`
    );

    try {
      const playerInfo: PlayerInfo = {
        playerId: player.playerId,
        username: player.username,
        picture: player.picture,
        cards: player.cards,
        rank: player.rank,
      };

      this.sendEvent(player.playerId, 'playerInfo', playerInfo);
    } catch (e) {
      this.logger.debug(
        'Server',
        `Could not send own info to player "${player.playerId}": `,
        e
      );
    }
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
      `Sending node info to player "${player.playerId}" for game "${game.id}"`
    );

    try {
      // Retrieve node info from provider and send it to the player
      this.sendEvent(
        player.playerId,
        'nodeInfo',
        await this.nodeProvider.getNodeInfo(game.nodeId),
      );
    } catch (e) {
      this.logger.debug(
        'Server',
        `Could not send game information to player "${player.playerId}": `,
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
    this.logger.debug('Server', `Dropping ${count} cards for player "${player.playerId}"`);

    const cardsMap = this.cardsManager.getCardsMap();
    const newCards = randomCards([...cardsMap.values()], count);

    try {
      player.cards = player.cards.concat(newCards);
      await player.save();

      // Notify player
      this.sendEvent(
        player.playerId,
        'newCards',
        newCards.map(cardId => cardsMap.get(cardId))
      );
    } catch (e) {
      this.logger.error(
        'Server',
        `Could not drop cards for player "${player.playerId}": `,
        e
      );
    }
  }
}

export interface ServerConfiguration {
  port: number;
  jwtPublicCert: string;
  jwtAlgorithms: string[];
}
