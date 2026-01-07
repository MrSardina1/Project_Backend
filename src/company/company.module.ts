import { Module } from '@nestjs/common';
import { CompanyService } from 'src/company/company.service';
import { CompanyController } from 'src/company/company.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from 'src/company/company.schema';
import { User, UserSchema } from 'src/user/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [CompanyService],
  controllers: [CompanyController],
})
export class CompanyModule {}