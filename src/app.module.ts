import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './Database/database.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './Auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AIChatModule } from './AIChat/aichat.module';
import { CompanyModule } from './company/company.module';
import { InternshipModule } from './Internship/internship.module';
import { ApplicationModule } from './Application/application.module';

@Module({
  imports: [
    DatabaseModule.forRoot(),
    UserModule,
    AuthModule,
    AIChatModule,
    CompanyModule,
    InternshipModule,
    ApplicationModule,
    CompanyModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}