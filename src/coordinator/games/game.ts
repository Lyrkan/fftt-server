import { GameStatus } from '../../common/statuses/game-status';

export class Game {
  private status: GameStatus;

  public constructor(
    public readonly id: string,
    public readonly nodeId: string,
    public readonly playerIds: string[],
  ) {
    this.status = GameStatus.IN_PROGRESS;
  }

  public getStatus() {
    return this.status;
  }

  public setStatus(status: GameStatus) {
    this.status = status;
  }
}
