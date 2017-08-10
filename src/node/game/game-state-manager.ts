import { Coordinates } from './game-board';
import { GameEvent } from './game-event';
import { GameListener } from './game-listener';
import { GameListeners } from './listeners';
import { GameStartEvent } from './events/game-start-event';
import { GameState, GameStateConfiguration } from './game-state';
import { GameStatus } from '../../common/statuses/game-status';
import { LoggerInterface } from '../../common/logger/logger';
import { PlayerMoveEvent } from './events/player-move-event';
import { PlayerPickEvent } from './events/player-pick-event';
import { Server } from '../server';

/**
 * This class holds the current game state and dispatch
 * game events to listeners.
 */
export class GameStateManager {
  private gameState: GameState;
  private gameListeners: Array<typeof GameListener>;

  /**
   * Constructor.
   *
   * @param logger    An instance of the logger service
   * @param server    An instance of a node server
   * @param config    Game settings
   * @param listeners An array containing all available listeners
   */
  public constructor(
    private logger: LoggerInterface,
    private server: Server,
    config: GameStateConfiguration,
    listeners: Array<typeof GameListener> = GameListeners
  ) {
    // Initialize a new game state
    this.gameState = new GameState(config);

    // Register the listeners that support
    // the config ruleset
    this.gameListeners = listeners.filter(listener => listener.supportsRuleset(config.ruleset));

    // Link the server to this state manager
    this.server.setGameStateManager(this);
  }

  /**
   * Start a new game.
   */
  public startGame(): void {
    if (this.gameState.getStatus() !== GameStatus.INITIALIZED) {
      this.logger.warn(
        'GameStateManager',
        `Game can't be started because it has the following status: "${this.gameState.getStatus()}"`
      );
      return;
    }

    this.logger.info('GameStateManager', 'Starting the game');
    this.gameState.setStatus(GameStatus.STARTING);
    this.dispatchEvent(new GameStartEvent());
  }

  /**
   * Dispatch a PlayerPickEvent.
   *
   * @param playerId Player that picked its cards
   * @param cardIds  Ids of the cards chosen by the player
   */
  public playerPickCards(playerId: string, cardIds: string[]): void {
    if (this.gameState.getStatus() !== GameStatus.PICK_PHASE) {
      this.logger.debug(
        'GameStateManager',
        `Player "${playerId}" tried to pick cards but this isn't the picking phase`
      );
      return;
    }

    this.dispatchEvent(new PlayerPickEvent(playerId, cardIds));
  }

  /**
   * Dispatch a PlayerMoveEvent.
   *
   * @param playerId    Player that placed a card
   * @param cardId      ID of the card
   * @param coordinates Coordinates
   */
  public playerMove(playerId: string, cardId: string, coordinates: Coordinates): void {
    // Ignore if the game isn't in progress
    if ((this.gameState.getStatus() !== GameStatus.IN_PROGRESS)) {
      this.logger.debug(
        'GameStateManager',
        `Player "${playerId}" tried to play but the game isn't in progress`
      );
      return;
    }

    // Ignore if this isn't this player's turn to play
    const currentPlayer = this.gameState.getCurrentPlayer();
    if (
      typeof currentPlayer === 'undefined' ||
      (this.gameState.getConfig().players[currentPlayer].playerId !== playerId)
    ) {
      this.logger.debug(
        'GameStateManager',
        `Player "${playerId}" tried to play but it isn't its turn`
      );
      return;
    }

    this.dispatchEvent(new PlayerMoveEvent(playerId, cardId, coordinates));
  }

  /**
   * Return the current instance of the logger.
   */
  public getLogger(): LoggerInterface {
    return this.logger;
  }

  /**
   * Return the current instance of the node server.
   */
  public getServer(): Server {
    return this.server;
  }

  /**
   * Return a copy of the current game state.
   */
  public getGameState(): GameState {
    return this.gameState.clone();
  }

  /**
   * Trigger listeners supporting the given event.
   *
   * @param event Event to be dispatched
   */
  private dispatchEvent(event: GameEvent): void {
    this.logger.debug('GameStateManager', `Dispatching event: ${JSON.stringify(event)}`);

    try {
      // Clone the current game state so we don't modify
      // any property before all listeners are called.
      const newState = this.gameState.clone();

      // Call listeners
      this.gameListeners
        .filter(listener => listener.supportsEvent(event))
        .forEach(listener => listener.trigger(this, newState, event));

      // If none of the listeners threw an exception
      // switch the game state to the new one.
      this.gameState = newState;
    } catch (e) {
      this.logger.debug(
        'GameStateManager',
        `One of the listeners didn't handle the given event: `,
        e
      );
    }
  }
}
