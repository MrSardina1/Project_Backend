import { Controller, Get, Param, Query, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/Auth/jwt.auth.guard';
import { RolesGuard } from 'src/Auth/roles.guard';
import { Roles } from 'src/Auth/roles.decorator';
import { Role } from 'src/Auth/roles.enum';
import { InternshipService } from 'src/Internship/internship.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company, CompanyDocument } from 'src/company/company.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COMPANY)
@Controller('company')
export class CompanyInternshipController {
  constructor(
    private internshipService: InternshipService,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  @Get('my-internships')
  async getMyInternships(@Req() req) {
    const company = await this.companyModel.findOne({ 
      user: new Types.ObjectId(req.user.userId) 
    });
    
    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    return this.internshipService.findByCompany(company._id.toString());
  }

  @Get('internship/:id/applications')
  async getInternshipApplications(
    @Req() req,
    @Param('id') internshipId: string,
    @Query('sortBy') sortBy?: string,
    @Query('filterBy') filterBy?: string,
    @Query('filterValue') filterValue?: string
  ) {
    // Validate ObjectId format first
    if (!Types.ObjectId.isValid(internshipId)) {
      throw new NotFoundException('Invalid internship ID format');
    }

    // Get company
    const company = await this.companyModel.findOne({ 
      user: new Types.ObjectId(req.user.userId) 
    });
    
    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    // Get internship with applications
    const result = await this.internshipService.getInternshipWithApplications(internshipId);
    
    if (!result) {
      throw new NotFoundException('Internship not found');
    }

    // Verify ownership - convert both to strings for comparison
    const internshipCompanyId = result.internship.company.toString();
    const userCompanyId = company._id.toString();

    if (internshipCompanyId !== userCompanyId) {
      throw new NotFoundException('This internship does not belong to your company');
    }

    let applications = result.applications;

    // Apply filters
    if (filterBy && filterValue) {
      applications = applications.filter((app: any) => {
        if (filterBy === 'name') {
          return app.student.username.toLowerCase().includes(filterValue.toLowerCase());
        } else if (filterBy === 'status') {
          return app.status === filterValue;
        }
        return true;
      });
    }

    // Apply sorting
    if (sortBy === 'name') {
      applications.sort((a: any, b: any) => 
        a.student.username.localeCompare(b.student.username)
      );
    } else if (sortBy === 'date') {
      applications.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return {
      internship: result.internship,
      applications
    };
  }
}