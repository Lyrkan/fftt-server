import { GameEvent } from '../../game-event';
import { GameListener } from '../../game-listener';
import { GameStatus } from '../../../../common/statuses/game-status';
import { GameState } from '../../game-state';
import { GameStateManager } from '../../game-state-manager';
import { PlayerMoveEvent } from '../../events/player-move-event';

/**
 * This listener ends a player turn by modifying
 * the current player index, or by ending the game
 * if the next player can't play anymore.
 */
export class EndTurn extends GameListener {
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
    // Update new player
    const hands = gameState.getPlayerHands();
    const newPlayerIndex = (gameState.getCurrentPlayer() + 1) % hands.length;
    gameState.setCurrentPlayer(newPlayerIndex);

    // Check if the new player can play or
    // end the game if that's not the case
    if (!hands[newPlayerIndex].length) {
      gameState.setStatus(GameStatus.ENDED);
    }

    // Check if the board is full
    const board = gameState.getBoard();
    if (board.isFull()) {
      gameState.setStatus(GameStatus.ENDED);
    }
  }
}
