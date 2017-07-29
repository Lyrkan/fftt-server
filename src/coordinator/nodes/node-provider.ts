import { GameInfo } from '../../common/dto/game-info';
import { Logger } from '../../common/services/logger/logger';
import { NodeInfo } from '../../common/dto/node-info';
import { Player } from '../model/player';
import { Ruleset } from '../../common/rules/ruleset';

export abstract class NodeProvider<T, U extends NodeConfiguration> {
  protected currentNodes: Map<string, T>;

  /**
   * Constructor.
   *
   * @param logger An instance of the logger service
   * @param config Settings for this node provider
   */
  public constructor(protected logger: Logger, protected config: U) {
    this.currentNodes = new Map<string, T>();
  }

  /**
   * Create and start a new node.
   *
   * @param players The players associated to the new node.
   */
  public abstract async createNode(players: Player[], ruleset: Ruleset): Promise<string>;

  /**
   * Stop a node.
   *
   * @param nodeId A Node ID
   */
  public abstract async stopNode(nodeId: string): Promise<void>;

  /**
   * Retrieve information (host, port, ...) and status
   * (starting, running, stopping, stopped, ...) for a given
   * node.
   *
   * @param nodeId A Node ID
   */
  public abstract async getNodeInfo(nodeId: string): Promise<NodeInfo>;

  /**
   * Retrieve info about the game running inside a given
   * node (in progress, ended, ...).
   *
   * @param nodeId A Node ID
   */
  public abstract async getGameInfo(nodeId: string): Promise<GameInfo>;
}

export interface NodeConfiguration {
  maxNodes: number;
  minPort: number;
  maxPort: number;
  jwtPublicCert: string;
  nodeTimeout: number;
}
