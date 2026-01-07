import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop()
  website: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;
}

export const CompanySchema = SchemaFactory.createForClass(Company);