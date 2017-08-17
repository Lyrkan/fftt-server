import { GameEvent } from '../../game-event';
import { GameListener } from '../../game-listener';
import { GameStatus } from '../../../../common/statuses/game-status';
import { GameStartEvent } from '../../events/game-start-event';
import { GameState } from '../../game-state';
import { GameStateManager } from '../../game-state-manager';
import { InvalidEventError } from '../../errors/invalid-event-error';
import { Ruleset } from '../../../../common/rules/ruleset';

/**
 * This listener checks if the status of the game
 * allows that kind of event.
 */
export class CheckGameStatus extends GameListener {
  /**
   * @inheritdoc
   */
  public static supportsRuleset(ruleset: Ruleset): boolean {
    return true;
  }

  /**
   * @inheritdoc
   */
  public static supportsEvent(event: GameEvent): boolean {
    return (event instanceof GameStartEvent);
  }

  /**
   * @inheritdoc
   */
  public static trigger(
    stateManager: GameStateManager,
    gameState: GameState,
    event: GameStartEvent
  ): void {
    const status = gameState.getStatus();

    if ((status !== GameStatus.STARTING)) {
      throw new InvalidEventError(
        `Can't start the game because its status doesn't allow it: ${status}`
      );
    }
  }
}
