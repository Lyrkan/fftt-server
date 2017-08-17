import { GameEvent } from '../../game-event';
import { GameListener } from '../../game-listener';
import { GameState } from '../../game-state';
import { GameStateManager } from '../../game-state-manager';
import { InvalidEventError } from '../../errors/invalid-event-error';
import { PlayerMoveEvent } from '../../events/player-move-event';
import { Ruleset } from '../../../../common/rules/ruleset';

/**
 * This listener checks if a card can be placed at the
 * given coordinates.
 */
export class CheckCoordinatesAvailability extends GameListener {
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
    const board = gameState.getBoard();
    const coordinates = event.coordinates;
    const currentState = board.getCardState(coordinates);

    if (currentState.cardId) {
      throw new InvalidEventError(
        `Coordinates (${coordinates.x},${coordinates.y}) are already used by another card`
      );
    }
  }
}
