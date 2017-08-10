import { GameEvent } from '../game-event';

/**
 * Event dispatched at the start of a new game.
 * He can be used to initialize things like
 * the board or to decide which player starts
 * first.
 */
export class GameStartEvent extends GameEvent {
}
