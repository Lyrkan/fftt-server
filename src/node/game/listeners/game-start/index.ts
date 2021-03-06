import { CheckGameStatus } from './check-game-status';
import { GameListener } from '../../game-listener';
import { InitFirstPlayer } from './init-first-player';
import { InitPlayerHands } from './init-player-hands';

export const GameStartListeners: Array<typeof GameListener> = [
  CheckGameStatus,
  InitFirstPlayer,
  InitPlayerHands,
];
