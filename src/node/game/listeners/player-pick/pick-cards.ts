import { GameEvent } from '../../game-event';
import { GameListener } from '../../game-listener';
import { GameState } from '../../game-state';
import { GameStateManager } from '../../game-state-manager';
import { InvalidEventError } from '../../errors/invalid-event-error';
import { PlayerPickEvent } from '../../events/player-pick-event';

/**
 * This listener checks if the chosen card are
 * available and add them to the player's hand.
 */
export class PickCards extends GameListener {
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
    const chosenCards = event.cardIds;
    const players = gameState.getConfig().players;
    const hands = gameState.getPlayerHands();

    // Check if the player is allowed to play
    const playerIndex = players.findIndex(p => p.playerId === event.playerId);
    if (playerIndex === -1) {
      throw new InvalidEventError(
        `Player "${event.playerId}" can't pick cards because it isn't part of the allowed players`
      );
    }

    if (hands[playerIndex].length > 0) {
      throw new InvalidEventError(`Player "${event.playerId}" already picked his cards`);
    }

    // Add given cards to the player's hand
    const availableCards = [...players[playerIndex].cards];
    const playerHand = [];

    for (const card of chosenCards) {
      const cardIndex = availableCards.indexOf(card);

      // Check if the card is still available in the player's deck
      if (cardIndex === -1) {
        throw new InvalidEventError(
          `Player "${event.playerId}" pick a card that isn't available in his deck: ${card}`
        );
      }

      playerHand.push(card);
      availableCards.splice(cardIndex, 1);
    }

    // Update player hands
    hands.splice(playerIndex, 1, playerHand);

    // Update game state
    gameState.setPlayerHands(hands);
  }
}
