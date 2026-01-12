import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AIChatService } from './aichat.service';
import { JwtAuthGuard } from '../Auth/jwt.auth.guard';
import * as aichatSchema from './aichat.schema';

@Controller('aichat')
export class AIChatController {
  constructor(private readonly aiChatService: AIChatService) {}

  @UseGuards(JwtAuthGuard)
  @Post('ask')
  async ask(@Req() req, @Body('prompt') prompt: string) {
    const userId = req.user.userId;
    return { response: await this.aiChatService.ask(userId, prompt) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('cv')
  async saveCV(@Req() req, @Body() cvData: aichatSchema.CVData) {
    const userId = req.user.userId;
    return this.aiChatService.saveCV(userId, cvData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('cv')
  async getCV(@Req() req) {
    const userId = req.user.userId;
    return this.aiChatService.getCV(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('cv/analyze')
  async analyzeCV(@Req() req) {
    const userId = req.user.userId;
    return { response: await this.aiChatService.analyzeCV(userId) };
  }
}