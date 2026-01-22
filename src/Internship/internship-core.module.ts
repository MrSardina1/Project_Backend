import { Module } from '@nestjs/common';
import { InternshipService } from 'src/Internship/internship.service';
import { AuthCoreModule } from 'src/Auth/auth-core.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Internship, InternshipSchema } from 'src/Internship/internship.schema';
import { Company, CompanySchema } from 'src/company/company.schema';
import { Application, ApplicationSchema } from 'src/Application/application.schema';

@Module({
    providers: [InternshipService],
    controllers: [], // No controllers
    imports: [
        AuthCoreModule, // Use AuthCoreModule instead of AuthModule
        MongooseModule.forFeature([
            { name: Internship.name, schema: InternshipSchema },
            { name: Company.name, schema: CompanySchema },
            { name: Application.name, schema: ApplicationSchema },
        ]),
    ],
    exports: [InternshipService]
})
export class InternshipCoreModule { }
