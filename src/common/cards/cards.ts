import { Card } from './card';

export const Cards: Card[] = [
  { id: 'foo', values: { top: 1, left: 1, bottom: 1, right: 1 } },
  { id: 'bar', values: { top: 10, left: 10, bottom: 10, right: 10 } }
];

export const CardsMap = new Map<string, Card>(
  Cards.map(c => [c.id, c] as [string, Card])
);
