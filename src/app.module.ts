import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './Database/database.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './Auth/auth.module';

import { CompanyModule } from './company/company.module';
import { InternshipModule } from './Internship/internship.module';
import { ApplicationModule } from './Application/application.module';
import { ReviewModule } from './Review/review.module';
import { AdminModule } from './Admin/admin.module';
import { ProfileModule } from './Profile/profile.module';
import { CompanyInternshipModule } from './CompanyInternship/company-internship.module';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    UserModule,
    AuthModule,

    CompanyModule,
    InternshipModule,
    ApplicationModule,
    ReviewModule,
    AdminModule,
    ProfileModule,
    CompanyInternshipModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }