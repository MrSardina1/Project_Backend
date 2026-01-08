import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { Review, ReviewSchema } from './review.schema';
import { Company, CompanySchema } from 'src/company/company.schema';
import { Application, ApplicationSchema } from 'src/Application/application.schema';
import { AuthModule } from 'src/Auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Application.name, schema: ApplicationSchema },
    ]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}