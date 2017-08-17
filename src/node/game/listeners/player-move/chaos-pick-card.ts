import { GameEvent } from '../../game-event';
import { GameListener } from '../../game-listener';
import { GameState } from '../../game-state';
import { GameStateManager } from '../../game-state-manager';
import { InvalidStateError } from '../../errors/invalid-state-error';
import { PlayerMoveEvent } from '../../events/player-move-event';
import { Ruleset, PickModifier } from '../../../../common/rules/ruleset';

/**
 * This listener picks a random card from a player's
 * hand. It can only be triggered if the Chaos rule
 * is enabled.
 */
export class ChaosPickCard extends GameListener {
  /**
   * @inheritdoc
   */
  public static supportsRuleset(ruleset: Ruleset): boolean {
    return (ruleset.pickModifier === PickModifier.CHAOS);
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
    const currentPlayer = gameState.getCurrentPlayer();
    const hands = gameState.getPlayerHands();
    const playerHand = hands[currentPlayer];

    if (!playerHand.length) {
      throw new InvalidStateError(`Player "${event.playerId}" has no available card`);
    }

    // Modify the event with a random card from the player's hand
    event.cardId = playerHand[Math.floor(Math.random() * playerHand.length)];
  }
}
