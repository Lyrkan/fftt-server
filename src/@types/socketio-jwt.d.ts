declare namespace SocketIOJwt {
  export interface AuthorizeOptions {
    secret?: Buffer,
    handshake?: boolean,
  }
}

declare module 'socketio-jwt' {
  export function authorize(opts: SocketIOJwt.AuthorizeOptions): ((socket: SocketIO.Socket) => void);
}
