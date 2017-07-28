import { Card } from './card';
import { Cards } from './cards';

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
 * Pick random cards from the available ones.
 *
 * @param count Number of random cards to be picked
 */
export function randomCards(count: number): string[] {
  const cards: string[] = [];

  if (Cards.length) {
    const cardValues = Cards.map(
      c => ({id: c.id, value: cardGlobalValue(c)})
    );

    for (let i = 0; i < count ; i++) {
      // TODO Change probability based on card values
      const randomCard = Math.floor(Math.random() * cardValues.length);
      cards.push(cardValues[randomCard].id);
    }
  }

  return cards;
}
