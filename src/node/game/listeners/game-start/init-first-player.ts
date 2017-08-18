import { GameEvent } from '../../game-event';
import { GameListener } from '../../game-listener';
import { GameStartEvent } from '../../events/game-start-event';
import { GameState } from '../../game-state';
import { GameStateManager } from '../../game-state-manager';

/**
 * This listener chooses which player starts
 * the game using the current ruleset.
 */
export class InitFirstPlayer extends GameListener {
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
    const config = gameState.getConfig();

    gameState.setCurrentPlayer(
      Math.floor(Math.random() * config.players.length)
    );
  }
}
