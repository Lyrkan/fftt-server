import * as fs from 'fs';
import * as http from 'http';
import * as socketio from 'socket.io';
import * as socketioJwt from 'socketio-jwt';
import { LoggerInterface } from '../common/logger/logger';

/**
 * Socket.IO server.
 */
export class Server {
  private config: ServerConfiguration;
  private httpServer: http.Server;
  private ioServer: SocketIO.Server;

  /**
   * Constructor.
   *
   * @param logger An instance of the logger service
   * @param config Server settings
   */
  public constructor(
    private logger: LoggerInterface,
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
   * Stop the server.
   */
  public async stop(): Promise<void> {
    await new Promise((resolve, reject) => {
      if (this.httpServer && this.httpServer.listening) {
        this.logger.info('Server', 'Stopping node server');

        const rejectListener = (e: Error) => {
          this.httpServer.removeListener('error', rejectListener);
          reject(e);
        };

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
   * Return the port the server is listening to
   * or null if there isn't one.
   */
  public getPort(): number|null {
    if (this.httpServer.listening) {
      return this.httpServer.address().port;
    }

    return null;
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
  }
}

export interface ServerConfiguration {
  minPort: number;
  maxPort: number;
  jwtPublicCert: string;
  jwtAlgorithms: string[];
}

interface DecodedToken {
  sub: string;
}
