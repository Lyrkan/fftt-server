import { GameEvent } from '../../game-event';
import { GameListener } from '../../game-listener';
import { GameState } from '../../game-state';
import { GameStateManager } from '../../game-state-manager';
import { InvalidEventError } from '../../errors/invalid-event-error';
import { InvalidStateError } from '../../errors/invalid-state-error';
import { PlayerMoveEvent } from '../../events/player-move-event';
import { Ruleset, PickModifier } from '../../../../common/rules/ruleset';

/**
 * This listener checks if the card chosen by the
 * player is allowed to be placed on the board.
 */
export class CheckChosenCard extends GameListener {
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
    const ruleset = gameState.getConfig().ruleset;
    const currentPlayer = gameState.getCurrentPlayer();
    const hands = gameState.getPlayerHands();
    const card = event.cardId;

    if (ruleset.pickModifier === PickModifier.CHAOS) {
      // If the Chaos rule is enabled the event shouldn't contain a card ID
      // since it'll be picked randomly
      if (card) {
        throw new InvalidEventError(
          `Player "${event.playerId}" chose a card but the Chaos rule is enabled`
        );
      }
    } else {
      // If the Chaos rule isn't enabled the event should contain a card ID
      if (!card) {
        throw new InvalidEventError(
          `Player "${event.playerId} didn't pick a card but the Chaos rule isn't enabled`
        );
      }

      if (ruleset.pickModifier === PickModifier.ORDER) {
        // If the Order rule is enabled the player has to pick the first card
        // in his hand.
        const expectedCard = hands[currentPlayer][0];

        if (!expectedCard) {
          throw new InvalidStateError(`Player "${event.playerId}" has no available card`);
        }

        if (expectedCard !== card) {
          throw new InvalidEventError(
            `Player "${event.playerId}"  must play card "${expectedCard}" (Order rule)`
          );
        }
      } else {
        // If no "pick" rule is enabled the player must choose a card from
        // his hand.
        const availableCards = hands[currentPlayer];

        if (availableCards.indexOf(card) === -1) {
          throw new InvalidEventError(
            `Player "${event.playerId}" tried to pick an unavailable card "${card}"`
          );
        }
      }
    }
  }
}
