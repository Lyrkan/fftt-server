import 'mocha';
import { expect } from 'chai';
import { Card } from '../../../src/common/cards/card';
import { cardGlobalValue, randomCards } from '../../../src/common/cards/card-utils';

const TEST_CARDS: Card[] = [
  { id: 'foo', values: { top: 1, left: 1, bottom: 1, right: 1 } },
  { id: 'bar', values: { top: 10, left: 10, bottom: 10, right: 10 } },
  { id: 'baz', values: { top: 5, left: 10, bottom: 5, right: 10 } },
  { id: 'qux', values: { top: 10, left: 5, bottom: 10, right: 5 } },
  { id: 'quux', values: { top: 8, left: 8, bottom: 5, right: 5 } },
  { id: 'corge', values: { top: 7, left: 7, bottom: 7, right: 7 } },
];

describe('Card-utils', () => {
  describe('#cardGlobalValue()', () => {
    it('should value cards correctly', () => {
      const expectedValues: { [id: string]: number } = {
        foo: 4,
        bar: 40,
        baz: 30,
        qux: 30,
        quux: 26,
        corge: 28,
      };

      for (const card of TEST_CARDS) {
        if (expectedValues.hasOwnProperty(card.id)) {
          expect(cardGlobalValue(card)).to.equal(expectedValues[card.id]);
        }
      }
    });
  });

  describe('#randomCards()', () => {
    it('should return one card by default', () => {
      expect(randomCards(TEST_CARDS).length).to.equal(1);
    });

    it('should return the right amount of cards', () => {
      for (let i = 0; i < 10; i++) {
        expect(randomCards(TEST_CARDS, i).length).to.equal(i);
      }
    });

    it('should be able to return the same card multiple times', () => {
      const card = TEST_CARDS[0];
      const res = randomCards([card], 3);
      expect(res.length).to.equal(3);
      expect(res[0]).to.equal(res[1]).to.equal(res[2]);
    });

    it('should be able to return every card', () => {
      const ids: Set<string> = new Set<string>();

      // 10k iterations should be more than enough for the
      // few test cards.
      for (let i = 0; i < 10000; i++) {
        const cardIds = randomCards(TEST_CARDS, 1);
        ids.add(cardIds[0]);
      }

      // Test if we encountered all the cards at least once
      for (const card of TEST_CARDS) {
        expect(ids).to.contain(card.id);
      }
    });
  });
});
