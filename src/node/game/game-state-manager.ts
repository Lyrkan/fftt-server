import { CardsManager } from '../../common/cards/cards-manager';
import { GameEvent } from './game-event';
import { GameListener } from './game-listener';
import { GameListeners } from './listeners';
import { GameStartEvent } from './events/game-start-event';
import { GameState, GameStateConfiguration } from './game-state';
import { GameStatus } from '../../common/statuses/game-status';
import { InvalidEventError } from './errors/invalid-event-error';
import { LoggerInterface } from '../../common/logger/logger';
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
   * @param logger       An instance of the logger service
   * @param server       An instance of a node server
   * @param cardsManager An instance of a cards manager
   * @param config       Game settings
   * @param listeners    An array containing all available listeners
   */
  public constructor(
    private logger: LoggerInterface,
    private server: Server,
    private cardsManager: CardsManager,
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
   * Trigger listeners supporting the given event.
   *
   * @param event Event to be dispatched
   */
  public dispatchEvent(event: GameEvent): void {
    this.logger.debug('GameStateManager', `Dispatching event: ${JSON.stringify(event)}`);

    try {
      // Clone the current game state so we don't modify
      // any property before all listeners are called.
      const newState = this.gameState.clone();

      // Call listeners
      // They will be able to modify the cloned game state
      // and the event itself.
      this.gameListeners
        .filter(listener => listener.supportsEvent(event))
        .forEach(listener => listener.trigger(this, newState, event));

      // If none of the listeners threw an exception
      // switch the game state to the new one.
      this.gameState = newState;

      // TODO Send new game state to players
    } catch (e) {
      if (e instanceof InvalidEventError) {
        this.logger.debug(
          'GameStateManager',
          `One of the listeners thinks that the given event is invalid: `,
          e
        );
      } else {
        this.logger.error(
          'GameStateManager',
          `One of the listeners couldn't handle the given event: `,
          e
        );
      }
    }
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
   * Return the current instance of the cards manager.
   */
  public getCardsManager(): CardsManager {
    return this.cardsManager;
  }

  /**
   * Return a copy of the current game state.
   */
  public getGameState(): GameState {
    return this.gameState.clone();
  }
}
