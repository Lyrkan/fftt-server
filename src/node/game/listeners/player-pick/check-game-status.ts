import { GameEvent } from '../../game-event';
import { GameListener } from '../../game-listener';
import { GameStatus } from '../../../../common/statuses/game-status';
import { GameState } from '../../game-state';
import { GameStateManager } from '../../game-state-manager';
import { InvalidEventError } from '../../errors/invalid-event-error';
import { PlayerPickEvent } from '../../events/player-pick-event';

/**
 * This listener checks if the status of the game
 * allows that kind of event.
 */
export class CheckGameStatus extends GameListener {
  /**
   * @inheritdoc
   */
  public static supportsEvent(event: GameEvent): boolean {
    return (event instanceof PlayerPickEvent);
  }

  /**
   * @inheritdoc
   */
  public static trigger(
    stateManager: GameStateManager,
    gameState: GameState,
    event: PlayerPickEvent
  ): void {
    const status = gameState.getStatus();
    const playerId = event.playerId;

    if (status !== GameStatus.PICK_PHASE) {
      throw new InvalidEventError(
        `Player "${playerId}" tried to pick cards but this isn't the pick phase`
      );
    }
  }
}
