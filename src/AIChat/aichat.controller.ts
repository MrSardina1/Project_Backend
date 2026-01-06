import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AIChatService } from './aichat.service';
import { JwtAuthGuard } from '../Auth/jwt.auth.guard';

@Controller('aichat')
export class AIChatController {
  constructor(private readonly aiChatService: AIChatService) {}

  @UseGuards(JwtAuthGuard)
  @Post('ask')
  async ask(@Req() req, @Body('prompt') prompt: string) {
    const userId = req.user.userId;
    return { response: await this.aiChatService.ask(userId, prompt) };
  }
}
