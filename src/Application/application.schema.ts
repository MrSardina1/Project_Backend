import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApplicationDocument = Application & Document;

@Schema({ timestamps: true })
export class Application {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Internship', required: true })
  internship: Types.ObjectId;

  @Prop({ default: 'pending' })
  status: string;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
