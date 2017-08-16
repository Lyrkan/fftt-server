import { CheckGameStatus } from './check-game-status';
import { GameListener } from '../../game-listener';

export const PlayerPickListeners: Array<typeof GameListener> = [
  CheckGameStatus,
];
