import { Module } from '@nestjs/common';
import { InternshipService } from 'src/Internship/internship.service';
import { InternshipController } from 'src/Internship/internship.controller';
import { AuthModule } from 'src/Auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Internship, InternshipSchema } from 'src/Internship/internship.schema';
import { Company, CompanySchema } from 'src/company/company.schema';

@Module({
  providers: [InternshipService],
  controllers: [InternshipController],
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Internship.name, schema: InternshipSchema},
      { name: Company.name, schema: CompanySchema},
    ]),
  ]
})
export class InternshipModule {}