import { Card } from './card';

export const Cards = new Map<string, Card>([
  ['foo', { id: 'foo', values: { top: 1, left: 1, bottom: 1, right: 1 } }],
  ['bar', { id: 'bar', values: { top: 10, left: 10, bottom: 10, right: 10 } }],
]);
