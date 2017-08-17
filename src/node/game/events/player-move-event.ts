import { Coordinates } from '../game-board';
import { GameEvent } from '../game-event';

/**
 * Event dispatched when a player places
 * a card on the board.
 */
export class PlayerMoveEvent extends GameEvent {
  /**
   * Constructor.
   *
   * @param playerId    ID of the player that triggered the event
   * @param cardId      ID of the card being placed on the board
   * @param coordinates Coordinates
   */
  public constructor(
    public playerId: string,
    public coordinates: Coordinates,
    public cardId?: string,
  ) {
    super();
  }
}
