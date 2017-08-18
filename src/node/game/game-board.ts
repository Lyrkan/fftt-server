/**
 * This class represents the state of a
 * board (which cards are on it and to whom they
 * belong).
 *
 * The (0,0) position is located at the top-left
 * corner of the board.
 */
export class GameBoard {
  private states: CardState[][];

  /**
   * Constructor.
   *
   * @param width  Width of the board
   * @param height Height of the board
   * @param states Initial card states
   */
  public constructor(
    public readonly width: number,
    public readonly height: number,
    states?: CardState[][]
  ) {
    this.states = states || [];

    if (!states) {
      for (let i = 0; i < width; i++) {
        const column: CardState[] = [];
        for (let j = 0; j < height; j++) {
          column.push({});
        }
        this.states.push(column);
      }
    }
  }

  /**
   * Change the state of a card on the board.
   *
   * @param coordinates Coordinates
   * @param state New state
   */
  public setCardState(coordinates: Coordinates, state: CardState): this {
    if (!this.isInside(coordinates)) {
      throw new Error(`Coordinate (${coordinates.x},${coordinates.y}) are outside of the board`);
    }

    this.states[coordinates.y][coordinates.x] = state;
    return this;
  }

  /**
   * Return the state of a card on the board.
   *
   * @param coordinates Coordinates
   */
  public getCardState(coordinates: Coordinates): CardState {
    if (!this.isInside(coordinates)) {
      throw new Error(`Coordinates (${coordinates.x},${coordinates.y}) are outside of the board`);
    }

    return { ...this.states[coordinates.y][coordinates.x] };
  }

  /**
   * Check if the given coordinates are inside
   * of the board.
   *
   * @param coordinates Coordinates
   */
  public isInside(coordinates: Coordinates): boolean {
    return (coordinates.x >= 0) && (coordinates.y >= 0)
      && (coordinates.x < this.width) && (coordinates.y < this.height);
  }

  /**
   * Check if the board is full.
   */
  public isFull(): boolean {
    return this.states.filter(
      column => column.filter(
        state => state.cardId
      ).length > 0
    ).length > 0;
  }

  /**
   * Clone the current board.
   */
  public clone(): GameBoard {
    return new GameBoard(
      this.width,
      this.height,
      this.states.map(column => [...column])
    );
  }
}

export interface CardState {
  cardId?: string;
  playerId?: string;
}

export interface Coordinates {
  x: number;
  y: number;
}
