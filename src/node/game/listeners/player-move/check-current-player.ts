import { GameEvent } from '../../game-event';
import { GameListener } from '../../game-listener';
import { GameState } from '../../game-state';
import { GameStateManager } from '../../game-state-manager';
import { InvalidEventError } from '../../errors/invalid-event-error';
import { PlayerMoveEvent } from '../../events/player-move-event';
import { Ruleset } from '../../../../common/rules/ruleset';

/**
 * This listener checks if the player associated to the
 * event is the one that should actually be playing.
 */
export class CheckCurrentPlayer extends GameListener {
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
    const currentPlayerIndex = gameState.getCurrentPlayer();

    if (typeof currentPlayerIndex !== 'undefined') {
      const eventPlayer = event.playerId;
      const expectedPlayer = gameState.getConfig().players[currentPlayerIndex].playerId;

      if (eventPlayer !== expectedPlayer) {
        throw new InvalidEventError(
          `Player "${event.playerId}" tried to play but it isn't its turn to do so`
        );
      }
    } else {
      throw new InvalidEventError(
        `Player "${event.playerId}" tried to play but current player is not defined`
      );
    }
  }
}
