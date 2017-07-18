import { Document, model, Model, Schema } from 'mongoose';

export const DEFAULT_RANK: number = 1500;

const PlayerSchema = new Schema({
  _id: String,
  nickname: String,
  rank: Number,
});

export interface Player extends Document {
  _id: string;
  nickname: string;
  rank: number;
}

export const PlayerModel: Model<Player> = model<Player>(
  'Player',
  PlayerSchema
);
