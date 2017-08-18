import { Coordinates } from '../../game-board';
import { GameEvent } from '../../game-event';
import { GameListener } from '../../game-listener';
import { GameState } from '../../game-state';
import { GameStateManager } from '../../game-state-manager';
import { InvalidStateError } from '../../errors/invalid-state-error';
import { PlayerMoveEvent } from '../../events/player-move-event';
import { Ruleset, BorderModifier, CaptureModifier } from '../../../../common/rules/ruleset';

/**
 * Return the difference between two cards values
 * based on the given ruleset.
 *
 * @param ruleset Ruleset to use
 * @param a       First value
 * @param b       Second value
 */
const compareValues = (ruleset: Ruleset, a: number, b: number): number => {
  const fallenAce = (ruleset.captureModifiers.indexOf(CaptureModifier.FALLEN_ACE) !== -1);
  const reverse = (ruleset.captureModifiers.indexOf(CaptureModifier.REVERSE) !== -1);

  let diff = a - b;

  if (fallenAce) {
    if ((a === 1) && (b === 10)) {
      diff = 1;
    } else if ((a === 10) && (b === 1)) {
      diff = -1;
    }
  }

  return reverse ? -diff : diff;
};

/**
 * This listener updates the state of the cards
 * on the board after a new one is placed on it.
 */
export class UpdateBoardState extends GameListener {
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
    if (!event.cardId) {
      throw new InvalidStateError(`The current event isn't associated to a card`);
    }

    // Retrieve the position of the cards to be checked
    const newCoordinates = event.coordinates;
    const topCoordinates: Coordinates = { x: newCoordinates.x, y: (newCoordinates.y - 1) };
    const leftCoordinates: Coordinates = { x: (newCoordinates.x - 1), y: newCoordinates.y };
    const bottomCoordinates: Coordinates = { x: newCoordinates.x, y: (newCoordinates.y + 1) };
    const rightCoordinates: Coordinates = { x: (newCoordinates.x + 1), y: newCoordinates.y };

    const config = gameState.getConfig();
    const board = gameState.getBoard();
    const ruleset = config.ruleset;
    const wrapBoard = (ruleset.borderModifier === BorderModifier.WRAP);

    // TODO Implement the following rules:
    const notImplementedRules = [
      CaptureModifier.SAME,
      CaptureModifier.COMBO,
      CaptureModifier.PLUS,
    ];

    if (notImplementedRules.filter(r => ruleset.captureModifiers.indexOf(r) !== -1).length) {
      throw new Error(
        `At least one game rule is not implemented yet: ${JSON.stringify(ruleset.captureModifiers)}`
      );
    }

    // If the "Wrap" rule is enabled
    if (wrapBoard) {
      topCoordinates.y = (topCoordinates.y < 0) ? (board.height - 1) : topCoordinates.y;
      leftCoordinates.x = (leftCoordinates.x < 0) ? (board.width - 1) : leftCoordinates.x;
      bottomCoordinates.y = (bottomCoordinates.y >= board.height) ? 0 : bottomCoordinates.y;
      rightCoordinates.x = (rightCoordinates.x >= board.width) ? 0 : rightCoordinates.x;
    }

    // Compute new states
    // TODO Refactor that part?
    const cardsManager = stateManager.getCardsManager();
    const newCard = cardsManager.getCard(event.cardId);

    // Top card
    if (board.isInside(topCoordinates)) {
      const topCardState = board.getCardState(topCoordinates);
      if (topCardState.cardId && (topCardState.playerId !== event.playerId)) {
        const topCard = cardsManager.getCard(topCardState.cardId);
        if (compareValues(ruleset, newCard.values.top, topCard.values.bottom) > 0) {
          topCardState.playerId = event.playerId;
          board.setCardState(topCoordinates, topCardState);
        }
      }
    }

    // Left card
    if (board.isInside(leftCoordinates)) {
      const leftCardState = board.getCardState(leftCoordinates);
      if (leftCardState.cardId && (leftCardState.playerId !== event.playerId)) {
        const leftCard = cardsManager.getCard(leftCardState.cardId);
        if (compareValues(ruleset, newCard.values.left, leftCard.values.right) > 0) {
          leftCardState.playerId = event.playerId;
          board.setCardState(leftCoordinates, leftCardState);
        }
      }
    }

    // Bottom card
    if (board.isInside(bottomCoordinates)) {
      const bottomCardState = board.getCardState(bottomCoordinates);
      if (bottomCardState.cardId && (bottomCardState.playerId !== event.playerId)) {
        const bottomCard = cardsManager.getCard(bottomCardState.cardId);
        if (compareValues(ruleset, newCard.values.bottom, bottomCard.values.top) > 0) {
          bottomCardState.playerId = event.playerId;
          board.setCardState(bottomCoordinates, bottomCardState);
        }
      }
    }

    // Right card
    if (board.isInside(rightCoordinates)) {
      const rightCardState = board.getCardState(rightCoordinates);
      if (rightCardState.cardId && (rightCardState.playerId !== event.playerId)) {
        const rightCard = cardsManager.getCard(rightCardState.cardId);
        if (compareValues(ruleset, newCard.values.right, rightCard.values.left) > 0) {
          rightCardState.playerId = event.playerId;
          board.setCardState(rightCoordinates, rightCardState);
        }
      }
    }

    // Update game state
    gameState.setBoard(board);
  }
}
