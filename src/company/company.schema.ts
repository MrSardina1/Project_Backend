import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ unique: true })
  email: string;

  @Prop()
  website: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);