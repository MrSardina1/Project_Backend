import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AIChatDocument = AIChat & Document;

// CV Data interface
export interface CVData {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  projects?: {
    name: string;
    description: string;
    technologies: string[];
  }[];
  languages?: string[];
  certifications?: string[];
  careerGoals?: string;
  preferredIndustries?: string[];
}

@Schema({ timestamps: true })
export class AIChat {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  prompt: string;

  @Prop({ required: true })
  response: string;

  @Prop({ default: 'openai' })
  provider: string;

  @Prop()
  error: string;

  @Prop({ type: Object })
  cvData?: CVData;

  @Prop({ default: false })
  isCVAnalysis: boolean;
}

export const AIChatSchema = SchemaFactory.createForClass(AIChat);