import { NodeStatus } from '../statuses/node-status';

export class NodeInfo {
  public readonly nodeId: string;
  public readonly status: NodeStatus;
  public readonly host: string|null;
  public readonly port: number|null;
}
