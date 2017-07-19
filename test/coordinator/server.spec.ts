import 'mocha';

describe('Server', () => {
  describe('#start()', () => {
    it('should be able to start');

    it('should be able to start again after being stopped');

    it('should be able to authenticate players using JWT');

    it('should be able to create a player in the database if it does not exist yet');

    it('should be able to retrieve an existing player from the database');

    it('should allow a player to register to matchmaking');

    it('should allow a player to withdraw from matchmaking');
  });

  describe('#stop()', () => {
    it('should be able to stop');
  });
});
