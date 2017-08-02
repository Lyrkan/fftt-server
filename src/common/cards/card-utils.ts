import { Card } from './card';

/**
 * Return a global value that represents the given card.
 * Can be used to check if a card is supposedly better
 * than another one.
 *
 * @param card A Card
 */
export function cardGlobalValue(card: Card): number {
  const values = card.values;
  return (values.top + values.bottom + values.left + values.right);
}

/**
 * Pick (almost) random cards from a given array and return
 * their ID.
 * This method is biased to avoid giving too many really
 * low or really high value cards too often.
 * A card CAN be picked twice.
 *
 * @param cards Available cards
 * @param count Number of random cards to be picked
 */
export function randomCards(cards: Card[], count: number = 1): string[] {
  const newCards: string[] = [];

  if (cards.length) {
    const cardsByValue = cards.reduce((prev: { [value: number]: Card[] }, current) => {
      const value = cardGlobalValue(current);
      if (!(value in prev)) {
        prev[value] = [];
      }
      prev[value].push(current);
      return prev;
    }, {});

    const availableValues = Object.keys(cardsByValue).map(val => parseInt(val, 10)).sort();
    const bias = availableValues.length / 2;

    for (let i = 0; i < count ; i++) {
      // First, retrieve a random value
      const rand = Math.random();
      const index = Math.floor(
        (Math.random() * availableValues.length) * (1 - rand) + (bias * rand)
      );
      const value: number = availableValues[index];

      // Then select a random card for this value
      const availableCards = cardsByValue[value];
      const randomCard = Math.floor(Math.random() * availableCards.length);
      newCards.push(availableCards[randomCard].id);
    }
  }

  return newCards;
}
