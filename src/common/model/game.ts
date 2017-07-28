import { Document, model, Model, Schema } from 'mongoose';
import { GameStatus } from '../statuses/game-status';

const GameSchema = new Schema({
  nodeId: String,
  playerIds: [String],
  status: String,
});

export interface Game extends Document {
  nodeId: string;
  playerIds: string[];
  status: GameStatus;
}

export const GameModel: Model<Game> = model<Game>(
  'Game',
  GameSchema
);
