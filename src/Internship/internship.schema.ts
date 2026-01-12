import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Company } from 'src/company/company.schema';

export type InternshipDocument = Internship & Document;

@Schema({ timestamps: true })
export class Internship {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  duration: string;

  @Prop({ type: Types.ObjectId, ref: Company.name })
  company: Types.ObjectId;

  // Virtual field for application count
  applicationCount?: number;
}

export const InternshipSchema = SchemaFactory.createForClass(Internship);