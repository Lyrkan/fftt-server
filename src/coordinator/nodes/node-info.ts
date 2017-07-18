import { NodeStatus } from '../../common/statuses/node-status';

export interface NodeInfo {
  readonly nodeId: string;
  readonly host: string;
  readonly port: number;
  readonly status: NodeStatus;
}
