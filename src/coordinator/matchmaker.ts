import * as uuid from 'uuid';
import { Game } from './games/game';
import { Logger } from '../common/services/logger';
import { NodesLimitReachedError } from './nodes/errors/nodes-limit-reached-error';
import { NodeProvider } from './nodes/node-provider';
import { IPlayer, PlayerModel, DEFAULT_RANK } from '../common/model/player';

export class Matchmaker {
  private playersQueue: Set<string>;

  /**
   * Constructor.
   *
   * @param logger   An instance of the logger service
   * @param provider A node provider
   */
  public constructor(private logger: Logger, private provider: NodeProvider<any>) {
    this.playersQueue = new Set<string>();
  }

  /**
   * Add a player to the waiting queue.
   *
   * @param playerId A player identifier
   */
  public addPlayer(playerId: string): void {
    this.playersQueue.add(playerId);
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
   * Check if groups can be formed using queued players
   * and start games accordingly.
   */
  public async tick(): Promise<Game[]> {
    const startedGames: Game[] = [];
    const groups =  await this.groupPlayers([...this.playersQueue]);

    // Start a new game for each group
    for (const group of groups) {
      try {
        // Start a new game
        const game = new Game(
          uuid.v4(),
          await this.provider.createNode(group),
          group
        );

        startedGames.push(game);
        this.logger.info('Matchmaker', `Started game "${game.id}"`);

        // TODO Send game info to players

        // Remove players from the queue
        for (const player of group) {
          this.removePlayer(player);
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
  private async groupPlayers(playerIds: string[]): Promise<string[][]> {
    this.logger.debug('Matchmaker', `Trying to group ${playerIds.length} player(s)`);

    // Retrieve players and their rank
    const rankedPlayers: IPlayer[] = [];
    for (const playerId of playerIds) {
      // Try to retrieve player from the db first
      try {
        const player = await PlayerModel.findOne({userId: playerId});

        if (player) {
          rankedPlayers.push(player);
        } else {
          // If the player is missing in the db, create it with the default rank
          try {
            const newPlayer = new PlayerModel({
              playerId,
              rank: DEFAULT_RANK,
            });

            await newPlayer.save();
            rankedPlayers.push(newPlayer);
          } catch (e) {
            this.logger.error(
              'Matchmaker',
              `An error occured while trying to create new player "${playerId}": `,
              e
            );
          }
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
    const groups: string[][] = [];
    let groupIndex = 0;
    let playerIndex = 0;

    for (const player of sortedRankedPlayers) {
      if (0 === playerIndex) {
        groups[groupIndex] = [];
      }

      groups[groupIndex].push(player.playerId);

      playerIndex++;

      if (playerIndex > 1) {
        groupIndex++;
        playerIndex = 0;
      }
    }

    // Remove last group if there is only one player
    if (groups.length && (groups[groups.length - 1].length === 1)) {
      groups.slice((groups.length - 1), 1);
    }

    return groups;
  }
}
