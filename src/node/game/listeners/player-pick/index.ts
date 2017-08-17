import { CheckGameStatus } from './check-game-status';
import { GameListener } from '../../game-listener';
import { PickCards } from './pick-cards';
import { Swap } from './swap';

export const PlayerPickListeners: Array<typeof GameListener> = [
  // Pre-checks
  CheckGameStatus,

  // Picks
  PickCards,

  // Swap modifier
  Swap,
];
