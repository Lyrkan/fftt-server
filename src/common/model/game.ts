import { Document, model, Model, Schema } from 'mongoose';
import { GameStatus } from '../statuses/game-status';

const GameSchema = new Schema({
  nodeId: String,
  players: [Schema.Types.ObjectId],
  status: String,
});

export interface Game extends Document {
  nodeId: string;
  players: any[];
  status: GameStatus;
}

export const GameModel: Model<Game> = model<Game>(
  'Game',
  GameSchema
);
