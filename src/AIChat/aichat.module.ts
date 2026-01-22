import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIChat, AIChatSchema } from './aichat.schema';
import { AIChatService } from './aichat.service';
import { AIChatController } from './aichat.controller';
import { AuthCoreModule } from '../Auth/auth-core.module';
import { Internship, InternshipSchema } from '../Internship/internship.schema';

@Module({
  imports: [
    AuthCoreModule,
    MongooseModule.forFeature([
      { name: AIChat.name, schema: AIChatSchema },
      { name: Internship.name, schema: InternshipSchema } // Add this line
    ]),
  ],
  providers: [AIChatService],
  controllers: [AIChatController],
})
export class AIChatModule { }