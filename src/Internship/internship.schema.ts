import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InternshipDocument = Internship & Document;

@Schema({ timestamps: true })
export class Internship {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Company' })
  company: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Application' })
  applications: Types.ObjectId[];
}

export const InternshipSchema = SchemaFactory.createForClass(Internship);
