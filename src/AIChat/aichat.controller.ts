import { Controller, Post, Get, Delete, Body, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { AIChatService } from './aichat.service';
import { JwtAuthGuard } from '../Auth/jwt.auth.guard';
import * as aichatSchema from './aichat.schema';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('aichat')
export class AIChatController {
  constructor(private readonly aiChatService: AIChatService) { }

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
  @Delete('cv')
  async deleteCV(@Req() req) {
    const userId = req.user.userId;
    return this.aiChatService.deleteCV(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('cv/analyze')
  async analyzeCV(@Req() req) {
    const userId = req.user.userId;
    return { response: await this.aiChatService.analyzeCV(userId) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-cv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCV(@Req() req, @UploadedFile() file: Express.Multer.File) {
    console.log('--- PDF Upload Started ---');
    if (!file) {
      console.error('Upload Error: No file provided by Multer');
      throw new BadRequestException('No file uploaded');
    }
    console.log(`Received file: ${file.originalname}, Size: ${file.size} bytes`);

    try {
      const userId = req.user.userId;
      console.log(`User ID: ${userId}`);

      console.log('Extracting text from PDF...');
      const text = await this.aiChatService.extractTextFromPDF(file.buffer);
      console.log(`Extracted text length: ${text.length} chars`);

      if (!text || text.trim().length === 0) {
        console.warn('Warning: Extracted text is empty');
      }

      console.log('Sending text for AI analysis...');
      const analysis = await this.aiChatService.analyzeCV(userId, text);
      console.log('AI Analysis complete');

      return { response: analysis };
    } catch (error) {
      console.error('PDF Upload/Analysis Error:', error);
      throw new BadRequestException(`Processing failed: ${error.message}`);
    } finally {
      console.log('--- PDF Upload Finished ---');
    }
  }
}