import 'mocha';
import { expect } from 'chai';
import { Matchmaker } from '../../src/coordinator/matchmaker';
import { NullLogger } from '../../src/common/services/logger/null-logger';
import { NullProvider } from '../../src/coordinator/nodes/providers/null-provider';

describe('Matchmaker', () => {
  let matchmaker: Matchmaker;

  beforeEach(() => {
    const logger = new NullLogger();
    const provider = new NullProvider(logger);
    matchmaker = new Matchmaker(
      logger,
      provider,
      {
        maxRankDifference: 500,
      }
    );
  });

  describe('#addPlayer()', () => {
    it('should be able to add players to the queue', () => {
      expect(matchmaker.getPlayersQueue().size).to.equal(0);

      matchmaker.addPlayer('player1', () => { /* Noop */ });
      expect(matchmaker.getPlayersQueue().size).to.equal(1);

      matchmaker.addPlayer('player2', () => { /* Noop */ });
      expect(matchmaker.getPlayersQueue().size).to.equal(2);
    });

    it('should not add the same player twice to the queue', () => {
      expect(matchmaker.getPlayersQueue().size).to.equal(0);

      matchmaker.addPlayer('player1', () => { /* Noop */ });
      matchmaker.addPlayer('player2', () => { /* Noop */ });
      expect(matchmaker.getPlayersQueue().size).to.equal(2);

      matchmaker.addPlayer('player1', () => { /* Noop */ });
      matchmaker.addPlayer('player1', () => { /* Noop */ });
      matchmaker.addPlayer('player2', () => { /* Noop */ });
      expect(matchmaker.getPlayersQueue().size).to.equal(2);
    });
  });

  describe('#removePlayer()', () => {
    it('should be able to remove players from the queue', () => {
      expect(matchmaker.getPlayersQueue().size).to.equal(0);

      matchmaker.addPlayer('player1', () => { /* Noop */ });
      matchmaker.addPlayer('player2', () => { /* Noop */ });
      expect(matchmaker.getPlayersQueue().size).to.equal(2);

      matchmaker.removePlayer('player1');
      expect(matchmaker.getPlayersQueue().size).to.equal(1);

      matchmaker.removePlayer('player2');
      expect(matchmaker.getPlayersQueue().size).to.equal(0);

    });
  });

  describe('#tick()', () => {
    it('should matchmake players based on their rank');

    it('should ask the node provider to create a new node for each new game');
  });
});
