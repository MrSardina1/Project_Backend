import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './Database/database.module';
import { AIChatModule } from './AIChat/aichat.module';
import { InternshipCoreModule } from './Internship/internship-core.module';
import * as dotenv from 'dotenv';

dotenv.config();

// Minimal module for AI Chat server
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        DatabaseModule,
        AIChatModule,
        InternshipCoreModule, // Needed for AI chat to recommend internships
    ],
})
class AIChatAppModule { }

async function bootstrap() {
    const app = await NestFactory.create(AIChatAppModule);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    app.enableCors({
        origin: 'http://localhost:4200',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });

    await app.listen(3001);
    console.log('AI Chat Server is running on http://localhost:3001');
}

bootstrap();
