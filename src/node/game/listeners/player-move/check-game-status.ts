import { GameEvent } from '../../game-event';
import { GameListener } from '../../game-listener';
import { GameStatus } from '../../../../common/statuses/game-status';
import { GameState } from '../../game-state';
import { GameStateManager } from '../../game-state-manager';
import { InvalidEventError } from '../../errors/invalid-event-error';
import { PlayerMoveEvent } from '../../events/player-move-event';

/**
 * This listener checks if the status of the game
 * allows that kind of event.
 */
export class CheckGameStatus extends GameListener {
  /**
   * @inheritdoc
   */
  public static supportsEvent(event: GameEvent): boolean {
    return (event instanceof PlayerMoveEvent);
  }

  /**
   * @inheritdoc
   */
  public static trigger(
    stateManager: GameStateManager,
    gameState: GameState,
    event: PlayerMoveEvent
  ): void {
    const status = gameState.getStatus();
    const playerId = event.playerId;

    if ((status !== GameStatus.IN_PROGRESS)) {
      throw new InvalidEventError(
        `Player "${playerId}" tried to play but the game isn't in progress`
      );
    }
  }
}
