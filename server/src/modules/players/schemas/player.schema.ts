import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlayerDocument = HydratedDocument<Player>;

@Schema({ _id: false })
export class Upgrades {
  @Prop({ default: 0, min: 0, max: 5 }) speed!: number;
  @Prop({ default: 0, min: 0, max: 5 }) comboPower!: number;
  @Prop({ default: 0, min: 0, max: 5 }) superRecharge!: number;
}
export const UpgradesSchema = SchemaFactory.createForClass(Upgrades);

@Schema({ timestamps: true })
export class Player {
  @Prop({ required: true, unique: true, index: true })
  playerId!: string;

  @Prop({ default: 1, min: 1 }) accountLevel!: number;
  @Prop({ default: 0, min: 0 }) accountXp!: number;
  @Prop({ default: 0, min: 0 }) coins!: number;
  @Prop({ default: 0, min: 0 }) gems!: number;

  @Prop({ type: [String], default: ['kori_voltz'] })
  unlockedCharacters!: string[];

  @Prop({ type: UpgradesSchema, default: () => ({}) })
  upgrades!: Upgrades;

  @Prop({ default: 0, min: 0 }) worldsCompleted!: number;
  @Prop({ default: 0, min: 0 }) dailyStreak!: number;
  @Prop({ type: Date }) lastDailyClaim?: Date;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
