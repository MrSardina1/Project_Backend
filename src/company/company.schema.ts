import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CompanyDocument = Company & Document;

export enum CompanyStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

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

  @Prop({
    type: String,
    enum: CompanyStatus,
    default: CompanyStatus.PENDING
  })
  status: CompanyStatus;

  @Prop({ required: false })  // Make optional
  profilePicture?: string;

  @Prop()
  deletedAt?: Date;
}

export const CompanySchema = SchemaFactory.createForClass(Company);