export interface Card {
  readonly values: CardValues;
  readonly element?: CardElement;
}

export interface CardValues {
  readonly top: CardValue;
  readonly right: CardValue;
  readonly bottom: CardValue;
  readonly left: CardValue;
}

export enum CardElement {
  EARTH     = 'Earth',
  FIRE      = 'Fire',
  WATER     = 'Water',
  POISON    = 'Poison',
  HOLY      = 'Holy',
  LIGHTNING = 'Lightning',
  WIND      = 'Wind',
  ICE       = 'Ice',
}

export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
