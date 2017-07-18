import * as fs from 'fs';
import * as http from 'http';
import * as socketio from 'socket.io';
import * as socketioJwt from 'socketio-jwt';
import { CoordinatorConfiguration } from './coordinator';
import { Logger } from '../common/services/logger';
import { PlayerModel, DEFAULT_RANK } from '../common/model/player';

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
        secret: jwtPublicCert
      })).on('authenticated', (socket: { decoded_token: any } & SocketIO.Socket) => {
        // Retrieve player information from JWT
        const decodedToken = socket.decoded_token;
        const id = decodedToken.sub;
        const username = decodedToken.username || id;

        this.logger.debug(
          'Server',
          `New client connected: ${JSON.stringify(decodedToken)}`
        );

        if (id) {
          // If the user has an id, check if it exists in the database, create it otherwise
          PlayerModel.findById(id).then(player => {
            if (!player) {
              // If the player is missing in the db, create it with the default rank
              const newPlayer = new PlayerModel({
                _id: id,
                username,
                rank: DEFAULT_RANK,
              });

              newPlayer.save().then(p => {
                this.logger.debug('Server', `Player "${id}" did not exist and was created`);
                this.sockets.set(id, socket);
              }).catch(e => {
                this.logger.error(
                  'Server',
                  `An error occured while trying to create new player "${id}": `,
                  e
                );
                socket.disconnect();
              });
            } else {
              this.logger.debug(
                'Server',
                `Player "${id}" was found in the database (rank: ${player.rank})`
              );
              this.sockets.set(player._id, socket);
            }
          });
        } else {
          this.logger.warn(
            'Server',
            `New client didn't have an ID in its token: ${JSON.stringify(decodedToken)}`
          );
          socket.disconnect();
        }
      });

      // TODO Handle disconnect event
    } catch (e) {
      this.logger.error('Server', 'Could not initialize JWT handling: ', e);
      process.exit(255);
    }
  }
}
