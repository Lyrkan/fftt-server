import { GameEvent } from '../../game-event';
import { GameListener } from '../../game-listener';
import { GameState } from '../../game-state';
import { GameStateManager } from '../../game-state-manager';
import { PlayerMoveEvent } from '../../events/player-move-event';

/**
 * This listener place the chosen card on the board.
 */
export class PlaceCard extends GameListener {
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
    const board = gameState.getBoard();

    // Update the board with the new card
    board.setCardState(event.coordinates, { cardId: event.cardId, playerId: event.playerId });

    // Update game state
    gameState.setBoard(board);
  }
}
