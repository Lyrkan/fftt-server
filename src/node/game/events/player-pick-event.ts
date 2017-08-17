import { GameEvent } from '../game-event';

/**
 * Event dispatched when a player chooses
 * which cards he wants to play with.
 * He may not be used for some game rules.
 */
export class PlayerPickEvent extends GameEvent {
  /**
   * Constructor.
   *
   * @param playerId  ID of the player
   * @param cardIds   IDs of the chosen cards
   */
  public constructor(
    public playerId: string,
    public cardIds: string[],
  ) {
    super();
  }
}
