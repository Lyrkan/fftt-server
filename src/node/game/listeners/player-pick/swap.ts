import { GameEvent } from '../../game-event';
import { GameListener } from '../../game-listener';
import { GameState } from '../../game-state';
import { GameStateManager } from '../../game-state-manager';
import { InvalidStateError } from '../../errors/invalid-state-error';
import { PlayerPickEvent } from '../../events/player-pick-event';
import { Ruleset, HandModifier } from '../../../../common/rules/ruleset';

/**
 * This listener swap 1 card for each player with
 * the next one. It can only be triggered if the
 * Swap rule is enabled.
 */
export class Swap extends GameListener {
  /**
   * @inheritdoc
   */
  public static supportsRuleset(ruleset: Ruleset): boolean {
    return (ruleset.handModifier === HandModifier.SWAP);
  }

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
    const players = gameState.getConfig().players;
    const hands = gameState.getPlayerHands();

    for (let i = 0; i < (hands.length - 1); i++) {
      if (!hands[i].length) {
        throw new InvalidStateError(
          `Can't swap: Player ${players[i].playerId} doesn't have any card in his hand`
        );
      }

      if (!hands[i + 1].length) {
        throw new InvalidStateError(
          `Can't swap: Player ${players[i + 1].playerId} doesn't have any card in his hand`
        );
      }

      // Swap one random card from player i and player (i + 1)
      const indexA = Math.floor(Math.random() * hands[i].length);
      const indexB = Math.floor(Math.random() * hands[i + 1].length);

      const cardA = hands[i][indexA];
      const cardB = hands[i + 1][indexB];

      hands[i][indexA] = cardB;
      hands[i + 1][indexB] = cardA;
    }

    // Update game state
    gameState.setPlayerHands(hands);
  }
}
