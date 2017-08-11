import * as fs from 'fs';
import * as socketioJwt from 'socketio-jwt';
import { AbstractServer, DecodedToken } from '../common/server/abstract-server';
import { GameStateManager } from './game/game-state-manager';
import { LoggerInterface } from '../common/logger/logger';
import { PlayerInfo } from '../common/dto/player-info';

/**
 * Socket.IO server.
 */
export class Server extends AbstractServer {
  private config: ServerConfiguration;
  private gameStateManager?: GameStateManager;

  /**
   * Constructor.
   *
   * @param logger An instance of the logger service
   * @param config Server settings
   */
  public constructor(
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
    this.logger.info('Server', 'Starting node server');

    if (this.httpServer.listening) {
      throw new Error(`Server is already running on port ${this.getPort()}`);
    }

    let minPort = 0;
    let maxPort = 0;

    if (this.config.minPort && this.config.maxPort) {
      minPort = this.config.minPort;
      maxPort = this.config.maxPort;
    }

    let started: boolean = false;
    for (let port = minPort; (port <= maxPort) && !started; port++) {
      try {
        await new Promise((resolve, reject) => {
          const rejectListener = (e: Error) => {
            this.httpServer.removeListener('error', rejectListener);
            reject(e);
          };

          this.httpServer
            .on('error', rejectListener)
            .listen(port, () => {
              this.logger.info('Server', `Server is now listening to port ${port}`);
              this.httpServer.removeListener('error', rejectListener);
              resolve();
            });
        });

        started = true;
      } catch (e) {
        if (e.code === 'EADDRINUSE') {
          this.logger.debug('Server', `Port ${port} is already in use, skipping it`);
        } else {
          this.logger.error('Server', 'Could not start server: ', e);
          throw e;
        }
      }
    }

    if (!started) {
      if (!minPort && !maxPort) {
        throw new Error(`Could not find a free port`);
      } else {
        throw new Error(
          `Could not find a free port in the ${this.config.minPort}-${this.config.maxPort} range`
        );
      }
    }
  }

  /**
   * Set the game state manager.
   *
   * The state manager can't be injected in the
   * constructor because of the circular reference.
   *
   * @param gameStateManager An instance of a game state manager
   */
  public setGameStateManager(gameStateManager: GameStateManager): this {
    this.gameStateManager = gameStateManager;
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
      'Node Server',
      `New client connected from ${socket.request.connection.remoteAddress}`
    );

    if (!this.gameStateManager) {
      this.logger.error(
        'Server',
        `Can't register player because the game state manager isn't available`
      );
      socket.disconnect(true);
      return;
    }

    const gameState = this.gameStateManager.getGameState();
    const gameConfiguration = gameState.getConfig();
    const playerInfo = gameConfiguration.players.find(
      player => player.playerId === decodedToken.sub
    );

    // Check if the player is allowed to connect
    if (!playerInfo) {
      this.logger.warn(
        'Server',
        `An unexpected player tried to connect to the server: "${decodedToken.sub}"`
      );
      socket.disconnect(true);
      return;
    }

    this.onPlayerRetrieved(socket, playerInfo);
  }
  /**
   * Called when a player successfuly joined the
   * server (after additional authorization checks).
   *
   * @param socket SocketIO Socket
   * @param player Player
   */
  private onPlayerRetrieved(socket: SocketIO.Socket, player: PlayerInfo) {
    this.logger.info('Server', `Player "${player.playerId}" joined the server`);

    // Disconnect old socket if there is one
    const oldSocket = this.sockets.get(player.playerId);
    if (oldSocket) {
      oldSocket.disconnect(true);
    }

    // Register new socket
    this.sockets.set(player.playerId, socket);

    // TODO Send current game state

    socket.on('disconnect',  () => this.onPlayerDisconnected(socket, player));
  }

  /**
   * Called when an authenticated player disconnects
   * from the server.
   *
   * @param player Player
   */
  private onPlayerDisconnected(socket: SocketIO.Socket, player: PlayerInfo) {
    // Only do something if this is the current socket for this player
    const currentPlayerSocket = this.sockets.get(player.playerId);
    if (currentPlayerSocket && (socket === currentPlayerSocket)) {
      this.logger.info('Server', `Player "${player.playerId}" disconnected`);
      this.sockets.delete(player.playerId);
    }
  }
}

export interface ServerConfiguration {
  minPort: number;
  maxPort: number;
  jwtPublicCert: string;
  jwtAlgorithms: string[];
}
