import { GameEvent } from '../../game-event';
import { GameListener } from '../../game-listener';
import { GameStartEvent } from '../../events/game-start-event';
import { GameState } from '../../game-state';
import { GameStateManager } from '../../game-state-manager';
import { GameStatus } from '../../../../common/statuses/game-status';
import { Ruleset, HandModifier } from '../../../../common/rules/ruleset';

/**
 * This listener either initializes player hands
 * or changes the current game state to the pick
 * phase.
 */
export class InitPlayerHands extends GameListener {
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
    event: GameEvent
  ): void {
    const config = gameState.getConfig();
    const ruleset = config.ruleset;

    if (ruleset.handModifier === HandModifier.RANDOM) {
      // Random modifier: pick random cards for each player
      const handSize = ruleset.handSize;
      const players = config.players;
      const hands: string[][] = [];

      for (const player of players) {
        const availableCards = [...player.cards];
        const playerHand: string[] = [];

        while ((playerHand.length < handSize) && (availableCards.length > 0)) {
          const index = Math.floor(Math.random() * availableCards.length);
          const card = availableCards.splice(index, 1)[0];
          playerHand.push(card);
        }

        hands.push(playerHand);
      }

      gameState.setPlayerHands(hands);
    } else {
      // No random modifier, start pick phase
      gameState.setStatus(GameStatus.PICK_PHASE);
    }
  }
}
