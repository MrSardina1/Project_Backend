import { Controller, UseGuards, Post, Get, Body, Req, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtAuthGuard } from 'src/Auth/jwt.auth.guard';
import { RolesGuard } from 'src/Auth/roles.guard';
import { InternshipService } from 'src/Internship/internship.service';
import { Role } from 'src/Auth/roles.enum';
import { Roles } from 'src/Auth/roles.decorator';
import { Public } from 'src/Auth/public.decorator';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { Company, CompanyDocument } from 'src/company/company.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('internships')
export class InternshipController {
  constructor(
    private internshipService: InternshipService,
    @InjectModel('Company') private companyModel: Model<CompanyDocument>,
  ) {}

  @Post()
  @Roles(Role.COMPANY)
  async create(
    @Body() body: CreateInternshipDto,
    @Req() req,
  ) {
    // Get the company ID linked to this user
    const userId = req.user.userId;
    const userObjectId = new Types.ObjectId(userId);
    
    const company = await this.companyModel.findOne({ user: userObjectId });
    
    if (!company) {
      throw new NotFoundException('Company profile not found for this user');
    }

    // Pass the company ID, not the user ID
    return this.internshipService.create(
      body,
      company._id.toString(),
    );
  }

  @Get()
  @Public()
  findAll() {
    return this.internshipService.findAll();
  }
}