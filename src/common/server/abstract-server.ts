import * as http from 'http';
import * as socketio from 'socket.io';
import { LoggerInterface } from '../logger/logger';

/**
 * Socket.IO server.
 */
export abstract class AbstractServer {
  protected httpServer: http.Server;
  protected ioServer: SocketIO.Server;
  protected sockets: Map<string, SocketIO.Socket>;

  /**
   * Constructor.
   *
   * @param logger An instance of the logger service
   */
  public constructor(protected logger: LoggerInterface) {
    this.httpServer = http.createServer();
    this.ioServer = socketio(this.httpServer);
  }

  /**
   * Start the server.
   */
  public abstract async start(): Promise<void>;

  /**
   * Stop the server.
   */
  public async stop(): Promise<void> {
    await new Promise((resolve, reject) => {
      if (this.httpServer && this.httpServer.listening) {
        this.logger.info('Server', 'Stopping server');

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
   * Send an event to a single player.
   *
   * @param playerId Player ID
   * @param event    Event name
   * @param message  Message associated to the event
   */
  public sendEvent(
    playerId: string,
    event: string,
    message?: {[key: string]: any}
  ) {
    const socket = this.getPlayerSocket(playerId);
    socket.send(event, message);
  }

  /**
   * Broadcast an event to all players.
   *
   * @param event    Event name
   * @param message  Message associated to the event
   * @param modifier An optional callback allowing to modify
   *                 the message being sent for each player.
   */
  public broadcastEvent(
    event: string,
    message?: {[key: string]: any},
    modifier: (message?: any, playerId?: string) => any = m => m
  ) {
      for (const [playerId, socket] of this.sockets.entries()) {
        socket.send(event, modifier(message, playerId));
      }
  }

  /**
   * Retrieve the current socket associated to a
   * player or throw an error if there is none.
   *
   * @param playerId Player ID
   */
  protected getPlayerSocket(playerId: string) {
    const socket = this.sockets.get(playerId);
    if (!socket) {
      throw new Error('Player is not associated to any active socket');
    }

    return socket;
  }
}

export interface DecodedToken {
  sub: string;
  username?: string;
  picture?: string;
}
