import { GameEvent } from './game-event';
import { GameState } from './game-state';
import { GameStateManager } from './game-state-manager';
import { Ruleset } from '../../common/rules/ruleset';

/**
 * Represent a game listener.
 *
 * Game listeners doesn't need to (and cannot) be
 * instanciated, so they must only implement static
 * methods.
 */
export abstract class GameListener {
  /**
   * Check if the listener must be enabled for
   * the given rules.
   *
   * @param ruleset Game rules
   */
  public static supportsRuleset(ruleset: Ruleset): boolean {
    return false;
  }

  /**
   * Check if the listener can be triggered for
   * the given event.
   *
   * @param event An event
   */
  public static supportsEvent(event: GameEvent): boolean {
    return false;
  }

  /**
   * Trigger the listener for the given event.
   *
   * @param stateManager An instance of a game state manager
   * @param gameState    A copy of the current game state, shared with other listeners
   * @param event        An event
   */
  public static trigger(
    stateManager: GameStateManager,
    gameState: GameState,
    event: GameEvent
  ): void {
    // Implement this method in other listeners
  }

  protected constructor() {
    throw new Error('A game listener cannot be instanciated');
  }
}
