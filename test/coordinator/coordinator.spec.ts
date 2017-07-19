import 'mocha';

describe('Coordinator', () => {
  describe('#start()', () => {
    it('should be able to start');

    it('should be able to start again after being stopped');

    it('should check if the coordinator is already running');

    it('should trigger a matchmaker tick periodically and register new games');

    it('should retrieve game statuses from running nodes periodically');

    it('should ask the node provider to stop a node if a game has ended');
  });

  describe('#stop()', () => {
    it('should be able to stop');

    it('should check if the coordinator is already stopped');
  });
});
