import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AIChatDocument = AIChat & Document;

@Schema({ timestamps: true })
export class AIChat {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  prompt: string;

  @Prop({ required: true })
  response: string;
}

export const AIChatSchema = SchemaFactory.createForClass(AIChat);
