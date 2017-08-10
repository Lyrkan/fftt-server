import { GameEvent } from '../../game-event';
import { GameListener } from '../../game-listener';
import { GameStartEvent } from '../../events/game-start-event';
import { GameState } from '../../game-state';
import { GameStateManager } from '../../game-state-manager';
import { Ruleset } from '../../../../common/rules/ruleset';

/**
 * This listener chooses which player starts
 * the game using the current ruleset.
 */
export class InitFirstPlayer extends GameListener {
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

    gameState.setCurrentPlayer(
      Math.floor(Math.random() * config.players.length)
    );
  }
}
