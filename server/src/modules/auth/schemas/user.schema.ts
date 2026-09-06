import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true, unique: true, index: true })
  playerId!: string;

  // GDPR: minors get no personalized ads / restricted purchases (GDD 13.3).
  @Prop({ default: false })
  isMinor!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
