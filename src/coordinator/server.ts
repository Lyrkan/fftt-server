import * as fs from 'fs';
import * as http from 'http';
import * as socketio from 'socket.io';
import * as socketioJwt from 'socketio-jwt';
import { CoordinatorConfiguration } from './coordinator';
import { Logger } from '../common/services/logger';
import { Matchmaker } from './matchmaker';
import { Player, PlayerModel, DEFAULT_RANK } from '../common/model/player';

/**
 * Socket.IO server.
 */
export class Server {
  private httpServer: http.Server;
  private ioServer: SocketIO.Server;
  private sockets: Map<string, SocketIO.Socket>;

  /**
   * Constructor.
   *
   * @param logger An instance of the logger service
   * @param config Coordinator settings
   */
  public constructor(
    private logger: Logger,
    private matchmaker: Matchmaker,
    private config: CoordinatorConfiguration,
  ) {
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

    await this.httpServer.listen(this.config.port);
  }

  /**
   * Stop the server.
   */
  public async stop() {
    await new Promise(resolve => {
      if (this.httpServer && this.httpServer.listening) {
        this.logger.info('Server', 'Stopping coordinator server');
        this.httpServer.close(() => {
          resolve();
        });
      } else {
        this.logger.warn('Server', 'Server was not running');
        resolve();
      }
    });
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
      process.exit(255);
    }
  }

  /**
   * Called when an authenticated player connects to
   * the server.
   *
   * @param socket       SocketIO Socket
   * @param decodedToken Decoded JWT
   */
  private onPlayerAuthenticated(socket: SocketIO.Socket, decodedToken: DecodedToken) {
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
  private onPlayerRetrieved(socket: SocketIO.Socket, player: Player) {
    this.logger.info('Server', `Player "${player._id}" joined the server`);
    this.sockets.set(player._id, socket);

    socket.on('disconnect', () => {
      this.onPlayerDisconnected(player);
    });

    socket.on('startSearch', () => {
      this.matchmaker.addPlayer(player._id);
    });

    socket.on('stopSearch', () => {
      this.matchmaker.removePlayer(player._id);
    });
  }

  /**
   * Called when an authenticated player disconnects
   * from the server.
   *
   * @param player Player
   */
  private onPlayerDisconnected(player: Player) {
    this.logger.info('Server', `Player "${player._id}" disconnected`);
    this.matchmaker.removePlayer(player._id);
    this.sockets.delete(player._id);
  }
}

interface DecodedToken {
  sub: string;
  username?: string;
  picture?: string;
}
