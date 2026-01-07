import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationDocument, ApplicationStatus } from './application.schema';
import { Internship, InternshipDocument } from 'src/Internship/internship.schema';
import { Company, CompanyDocument } from 'src/company/company.schema';
import { Role } from 'src/Auth/roles.enum';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(Application.name)
    private applicationModel: Model<ApplicationDocument>,
    @InjectModel(Internship.name)
    private internshipModel: Model<InternshipDocument>,
    @InjectModel(Company.name)
    private companyModel: Model<CompanyDocument>,
  ) {}

  async apply(studentId: string, internshipId: string) {
    // Check if internship exists
    const internship = await this.internshipModel.findById(internshipId);
    if (!internship) {
      throw new NotFoundException('Internship not found');
    }

    // Check if student already applied
    const existingApplication = await this.applicationModel.findOne({
      student: studentId,
      internship: internshipId,
    });

    if (existingApplication) {
      throw new ForbiddenException('You have already applied for this internship');
    }

    return this.applicationModel.create({
      student: studentId,
      internship: internshipId,
    });
  }

  async findAll(userId: string, userRole: Role) {
    if (userRole === Role.ADMIN) {
      // Admin sees ALL applications
      return this.applicationModel
        .find()
        .populate('student', 'username email')
        .populate({
          path: 'internship',
          populate: {
            path: 'company',
            select: 'name email website'
          }
        });
    }

    if (userRole === Role.COMPANY) {
      // Convert userId string to ObjectId for proper Mongoose comparison
      const userObjectId = new Types.ObjectId(userId);
      
      console.log('=== COMPANY VIEW DEBUG ===');
      console.log('User ID (string):', userId);
      console.log('User ID (ObjectId):', userObjectId);
      
      const company = await this.companyModel.findOne({ user: userObjectId });
      
      console.log('Found company:', company?._id, company?.name);
      
      if (!company) {
        throw new NotFoundException(
          `Company profile not found for user ${userId}. Make sure your user is properly linked to a company.`
        );
      }

      // First, find all internships belonging to this company
      const companyInternships = await this.internshipModel.find({ 
        company: company._id 
      }).select('_id title');

      console.log('Company internships found:', companyInternships.length);
      console.log('Internship IDs:', companyInternships.map(i => i._id));

      const internshipIds = companyInternships.map(i => i._id);

      // Find applications for those internships
      const applications = await this.applicationModel
        .find({ internship: { $in: internshipIds } })
        .populate('student', 'username email')
        .populate({
          path: 'internship',
          populate: {
            path: 'company',
            select: 'name email website'
          }
        });

      console.log('Applications found:', applications.length);
      console.log('=== END DEBUG ===');

      return applications;
    }

    throw new ForbiddenException('Unauthorized to view applications');
  }

  async updateStatus(
    applicationId: string,
    status: ApplicationStatus,
    userId: string,
    userRole: Role,
  ) {
    const application = await this.applicationModel
      .findById(applicationId)
      .populate('internship');

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Admin can update any application
    if (userRole === Role.ADMIN) {
      application.status = status;
      return application.save();
    }

    // Company can only update applications for their own internships
    if (userRole === Role.COMPANY) {
      // Convert userId string to ObjectId for proper Mongoose comparison
      const userObjectId = new Types.ObjectId(userId);
      
      const company = await this.companyModel.findOne({ user: userObjectId });
      
      if (!company) {
        throw new NotFoundException('Company profile not found');
      }

      const internship = application.internship as any;
      
      // Check if this internship belongs to this company
      if (internship.company.toString() !== company._id.toString()) {
        throw new ForbiddenException('You can only update applications for your own internships');
      }

      application.status = status;
      return application.save();
    }

    throw new ForbiddenException('Unauthorized to update application status');
  }
}