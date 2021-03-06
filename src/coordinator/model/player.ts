import { Document, model, Model, Schema } from 'mongoose';

export const DEFAULT_RANK: number = 1500;

const PlayerSchema = new Schema({
  playerId: { type: String, unique: true },
  username: String,
  picture: String,
  rank: Number,
  cards: [String],
});

export interface Player extends Document {
  playerId: string;
  username: string;
  picture?: string|null;
  rank: number;
  cards: string[];
}

export const PlayerModel: Model<Player> = model<Player>(
  'Player',
  PlayerSchema
);
