import { GameListener } from '../game-listener';
import { GameStartListeners } from './game-start';
import { PlayerMoveListeners } from './player-move';
import { PlayerPickListeners } from './player-pick';

export const GameListeners: Array<typeof GameListener> = [
  ...GameStartListeners,
  ...PlayerMoveListeners,
  ...PlayerPickListeners,
];
