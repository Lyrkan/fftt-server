import { NodeStatus } from '../../common/statuses/node-status';

export interface NodeInfo {
  readonly nodeId: string;
  readonly status: NodeStatus;
  readonly host: string|null;
  readonly port: number|null;
}
