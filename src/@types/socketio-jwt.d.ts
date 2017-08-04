/* tslint:disable:no-namespace */

declare namespace SocketIOJwt {
  export interface AuthorizeOptions {
    secret?: Buffer;
    handshake?: boolean;
    callback?: boolean | number;
    algorithms?: string[];
  }

  export type AuthorizeCallback = ((socket: SocketIO.Socket) => void);
}

declare module 'socketio-jwt' {
  export function authorize(opts: SocketIOJwt.AuthorizeOptions): SocketIOJwt.AuthorizeCallback;
}
