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
  const availableCards = Array.from(Cards.values())
    .map(c => ({id: c.id, value: cardGlobalValue(c)}));

  const cards: string[] = [];

  // TODO Change probability based on card global value

  if (availableCards.length) {
    for (let i = 0; i < count ; i++) {
      const randomCard = Math.floor(Math.random() * availableCards.length);
      cards.push(availableCards[randomCard].id);
    }
  }

  return cards;
}
