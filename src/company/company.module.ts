import { Module } from '@nestjs/common';
import { CompanyService } from 'src/company/company.service';
import { CompanyController } from 'src/company/company.controller';
import { AuthModule } from 'src/Auth/auth.module';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from 'src/company/company.schema';

@Module({
  providers: [CompanyService],
  controllers: [CompanyController],
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema},
    ]),
  ]
})
export class CompanyModule {}
