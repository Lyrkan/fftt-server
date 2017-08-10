import { GameBoard } from './game-board';
import { GameStatus } from '../../common/statuses/game-status';
import { PlayerInfo } from '../../common/dto/player-info';
import { Ruleset } from '../../common/rules/ruleset';

/**
 * This class holds a game state.
 */
export class GameState {
  private config: GameStateConfiguration;
  private status: GameStatus;
  private board: GameBoard;
  private playerHands: string[][];
  private currentPlayer: number;

  /**
   * Constructor.
   *
   * @param config Game settings
   */
  public constructor(config: GameStateConfiguration) {
    this.config = { ...config };
    this.status = GameStatus.INITIALIZED;
    this.board = new GameBoard(config.ruleset.boardWidth, config.ruleset.boardHeight);
    this.playerHands = new Array<string[]>(this.config.players.length).fill([]);
    this.currentPlayer = 0;
  }

  /**
   * Return a copy of the game settings.
   */
  public getConfig(): GameStateConfiguration {
    return { ...this.config };
  }

  /**
   * Return the current game status.
   */
  public getStatus(): GameStatus {
    return this.status;
  }

  /**
   * Set the game status.
   *
   * @param status New status
   */
  public setStatus(status: GameStatus): this {
    this.status = status;
    return this;
  }

  /**
   * Return the index of the current player if
   * available.
   */
  public getCurrentPlayer(): number | undefined {
    return this.currentPlayer;
  }

  /**
   * Set the index of the current player.
   *
   * @param currentPlayer New player index
   */
  public setCurrentPlayer(currentPlayer: number): this {
    if ((currentPlayer < 0) || (currentPlayer >= this.config.players.length)) {
      throw new Error(`Player index must be >= 0 and < ${this.config.players.length}`);
    }

    this.currentPlayer = currentPlayer;
    return this;
  }

  /**
   * Return a copy of the current board.
   */
  public getBoard(): GameBoard | undefined {
    return this.board.clone();
  }

  /**
   * Set a new state for the board.
   *
   * @param board New board state
   */
  public setBoard(board: GameBoard): this {
    this.board = board.clone();
    return this;
  }

  /**
   * Return a copy of the current hand
   * for each player.
   */
  public getPlayerHands(): string[][] | undefined {
    return this.playerHands.map(hand => [...hand]);
  }

  /**
   * Set the hand of each player.
   *
   * @param playerHands New hands
   */
  public setPlayerHands(playerHands: string[][]): this {
    if (playerHands.length !== this.config.players.length) {
      // tslint:disable-next-line:max-line-length
      throw new Error(`Expected ${this.config.players.length} hands instead of ${playerHands.length}`);
    }

    this.playerHands = playerHands.map(hand => [...hand]);
    return this;
  }

  /**
   * Clone the current game state.
   */
  public clone(): GameState {
    const newState = new GameState(this.config);

    newState.setStatus(this.status);
    newState.setCurrentPlayer(this.currentPlayer);
    newState.setBoard(this.board);
    newState.setPlayerHands(this.playerHands);

    return newState;
  }
}

export interface GameStateConfiguration {
  players: PlayerInfo[];
  ruleset: Ruleset;
}
