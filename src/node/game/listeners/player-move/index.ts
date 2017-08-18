import { ChaosPickCard } from './chaos-pick-card';
import { CheckChosenCard } from './check-chosen-card';
import { CheckCoordinatesAvailability } from './check-coordinates-availability';
import { CheckCurrentPlayer } from './check-current-player';
import { CheckGameStatus } from './check-game-status';
import { EndTurn } from './end-turn';
import { GameListener } from '../../game-listener';
import { PlaceCard } from './place-card';
import { UpdateBoardState } from './update-board-state';

export const PlayerMoveListeners: Array<typeof GameListener> = [
  // Pre-checks
  CheckGameStatus,
  CheckCurrentPlayer,
  CheckCoordinatesAvailability,
  CheckChosenCard,

  // Chaos modifier
  ChaosPickCard,

  // Place new card on board
  PlaceCard,

  // Update board state
  UpdateBoardState,

  // End turn
  EndTurn,
];
