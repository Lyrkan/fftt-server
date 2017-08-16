import { CheckCurrentPlayer } from './check-current-player';
import { CheckGameStatus } from './check-game-status';
import { GameListener } from '../../game-listener';

export const PlayerMoveListeners: Array<typeof GameListener> = [
  CheckGameStatus,
  CheckCurrentPlayer,
];
