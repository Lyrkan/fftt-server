import { GameStatus } from '../common/statuses/game-status';

export class GameState {
  private gameStatus: GameStatus;

  public constructor() {
    this.gameStatus = GameStatus.IN_PROGRESS;
  }

  public getGameStatus() {
    return this.gameStatus;
  }

  public setGameStatus(gameStatus: GameStatus) {
    this.gameStatus = gameStatus;
  }
}
