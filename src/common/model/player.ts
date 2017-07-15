import { Document, model, Model, Schema } from 'mongoose';

const PlayerSchema = new Schema({
  playerId: String,
  rank: Number,
});

export interface IPlayer extends Document {
  playerId: string;
  rank: number;
}

export const PlayerModel: Model<IPlayer> = model<IPlayer>(
  'Player',
  PlayerSchema
);