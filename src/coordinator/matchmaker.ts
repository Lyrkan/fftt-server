import { Game, GameModel } from './model/game';
import { GameStatus } from '../common/statuses/game-status';
import { LoggerInterface } from '../common/logger/logger';
import { NodesLimitReachedError } from './nodes/errors/nodes-limit-reached-error';
import { NodeProvider, NodeConfiguration } from './nodes/node-provider';
import { Player, PlayerModel } from './model/player';
import { StandardRuleset } from '../common/rules/presets/standard-ruleset';

/**
 * The role of the Matchmaker is to manage a queue of users waiting
 * for a game. It first tries to match users based on their current
 * rank, and then creates games accordingly.
 */
export class Matchmaker {
  private config: MatchmakerConfiguration;
  private playersQueue: Map<string, (g: Game) => void>;

  /**
   * Constructor.
   *
   * @param logger   An instance of the logger service
   * @param provider A node provider
   * @param config   Matchmaker settings
   */
  public constructor(
    private logger: LoggerInterface,
    private provider: NodeProvider<any, NodeConfiguration>,
    config: MatchmakerConfiguration,
  ) {
    this.config = { ...config };
    this.playersQueue = new Map<string, (g: Game) => void>();
  }

  /**
   * Add a player to the waiting queue.
   *
   * @param playerId A player identifier
   * @param callback A function called when a game has been found
   */
  public addPlayer(playerId: string, callback: (g: Game) => void): void {
    this.playersQueue.set(playerId, callback);
  }

  /**
   * Remove a player from the waiting queue.
   *
   * @param playerId A player identifier
   */
  public removePlayer(playerId: string): void {
    this.playersQueue.delete(playerId);
  }

  /**
   * Return a copy of the current players queue without
   * the associated callbacks.
   */
  public getPlayersQueue(): Set<string> {
    return new Set<string>(this.playersQueue.keys());
  }

  /**
   * Check if groups can be formed using queued players
   * and start games accordingly.
   */
  public async tick(): Promise<Game[]> {
    const startedGames: Game[] = [];
    const groups =  await this.groupPlayers(this.getPlayersQueue());

    // Start a new game for each group
    for (const group of groups) {
      try {
        const newGame = new GameModel({
          nodeId: await this.provider.createNode(group, StandardRuleset),
          players: group.map(player => player.playerId),
          status: GameStatus.UNKNOWN,
        });
        await newGame.save();

        startedGames.push(newGame);
        this.logger.info('Matchmaker', `Started game "${newGame.id}"`);

        // Call callbacks and remove players from the queue
        for (const player of group) {
          const callback = this.playersQueue.get(player.playerId);
          if (callback) {
            callback(newGame);
          }
          this.removePlayer(player.playerId);
        }
      } catch (e) {
        if (e instanceof NodesLimitReachedError) {
          this.logger.debug(
            'Matchmaker',
            'Could not start a game because the node limit has been reached'
          );
        } else {
          this.logger.warn(
            'Matchmaker',
            'Could not start a game because an error occured: ',
            e
          );
        }
      }
    }

    return startedGames;
  }

  /**
   * Split a single unidimensional array of player identifiers
   * into multiple groups that can be used to create games.
   *
   * @param playerIds An array of player identifiers
   */
  private async groupPlayers(playerIds: Set<string>): Promise<Player[][]> {
    this.logger.debug('Matchmaker', `Trying to group ${playerIds.size} player(s)`);

    // Retrieve players and their rank
    const rankedPlayers: Player[] = [];
    for (const playerId of playerIds) {
      // Try to retrieve player from the db first
      try {
        const player = await PlayerModel.findOne({ playerId });

        if (player) {
          rankedPlayers.push(player);
        } else {
          this.logger.warn(
            'Matchmaker',
            `Player "${playerId}" is registered but could not be found in the database`,
          );
          this.removePlayer(playerId);
        }
      } catch (e) {
        this.logger.error(
          'Matchmaker',
          `An error occured while tyring to retrieve player "${playerId}": `,
          e
        );
      }
    }

    // Sort players based on their rank
    const sortedRankedPlayers = rankedPlayers.sort((playerA, playerB) => {
      if (playerA.rank < playerB.rank) {
        return 1;
      } else if (playerA.rank > playerB.rank) {
        return -1;
      } else {
        return 0;
      }
    });

    // Group players
    const groups: Player[][] = [];
    let currentGroup: Player[]|null = null;

    for (const player of sortedRankedPlayers) {
      if (
        !currentGroup ||
        Math.abs(currentGroup[0].rank - player.rank) > this.config.maxRankDifference
      ) {
        currentGroup = [];
      }

      currentGroup.push(player);

      if (currentGroup.length > 1) {
        groups.push(currentGroup);
      }
    }

    return groups;
  }
}

export interface MatchmakerConfiguration {
  maxRankDifference: number;
}
