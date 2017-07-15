import * as uuid from 'uuid';
import { Game } from './games/game';
import { Logger } from '../common/services/logger';
import { NodesLimitReachedError } from './nodes/errors/nodes-limit-reached-error';
import { NodeProvider } from './nodes/node-provider';
import { IPlayer, PlayerModel } from '../common/model/player';

const DEFAULT_RANK: number = 1500;

export class Matchmaker {
  private playersQueue: Set<string>;

  /**
   * Constructor.
   *
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
   * @param players An array of player identifiers
   */
  private async groupPlayers(playerIds: string[]): Promise<string[][]> {
    this.logger.debug('Matchmaker', `Trying to group ${playerIds.length} player(s)`);

    // Sort players by descending rank
    const rankedPlayers: IPlayer[] = (await Promise.all(playerIds.map(async id => {
      let player: IPlayer | null = null;

      // Try to retrieve player from the db first
      try {
        player = await PlayerModel.findOne({userId: id});

        if (!player) {
          // If the player is missing in the db, create it with the default rank
          try {
            const newPlayer = new PlayerModel({
              playerId: id,
              rank: DEFAULT_RANK,
            });

            await newPlayer.save();

            player = newPlayer;
          } catch (e) {
            this.logger.warn(
              'Matchmaker',
              `An error occured while trying to create new player "${id}": `,
              e
            );
          }
        }
      } catch (e) {
        this.logger.warn(
          'Matchmaker',
          `An error occured while tyring to retrieve player "${id}": `,
          e
        );
      }

      return player;
    })))
    .filter(player => null !== player)
    .map(player => player as IPlayer)
    .sort((playerA, playerB) => {
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

    for (const player of rankedPlayers) {
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
