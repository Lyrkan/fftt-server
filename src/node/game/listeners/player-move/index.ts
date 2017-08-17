import { ChaosPickCard } from './chaos-pick-card';
import { CheckChosenCard } from './check-chosen-card';
import { CheckCoordinatesAvailability } from './check-coordinates-availability';
import { CheckCurrentPlayer } from './check-current-player';
import { CheckGameStatus } from './check-game-status';
import { EndTurn } from './end-turn';
import { GameListener } from '../../game-listener';
import { PlaceCard } from './place-card';

export const PlayerMoveListeners: Array<typeof GameListener> = [
  // Pre-checks
  CheckGameStatus,
  CheckCurrentPlayer,
  CheckCoordinatesAvailability,
  CheckChosenCard,

  // Chaos modifier
  ChaosPickCard,

  // Place card on board
  PlaceCard,

  // TODO Update board state

  // End turn
  EndTurn,
];
