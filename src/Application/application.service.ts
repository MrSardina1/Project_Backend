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
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(internshipId)) {
      throw new NotFoundException(`Invalid internship ID format: ${internshipId}`);
    }

    const internship = await this.internshipModel.findById(internshipId);
    if (!internship) {
      throw new NotFoundException('Internship not found');
    }

    const existingApplication = await this.applicationModel.findOne({
      student: studentId,
      internship: internshipId,
    });

    if (existingApplication) {
      throw new ForbiddenException('You have already applied for this internship');
    }

    // Ensure we're storing as ObjectId
    return this.applicationModel.create({
      student: new Types.ObjectId(studentId),
      internship: new Types.ObjectId(internshipId),
    });
  }

  async findAll(userId: string, userRole: Role) {
    if (userRole === Role.ADMIN) {
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
      console.log('=== COMPANY VIEW DEBUG ===');
      console.log('User ID (string):', userId);
      
      const company = await this.companyModel.findOne({ 
        user: new Types.ObjectId(userId) 
      });
      
      if (!company) {
        console.log('ERROR: Company profile not found for user:', userId);
        throw new NotFoundException(
          `Company profile not found for user ${userId}.`
        );
      }

      console.log('Found company ID:', company._id.toString());
      console.log('Found company name:', company.name);

      const companyInternships = await this.internshipModel.find({ 
        company: company._id 
      }).select('_id title');

      console.log('Company internships found:', companyInternships.length);
      if (companyInternships.length > 0) {
        console.log('Internship IDs:', companyInternships.map(i => i._id.toString()));
        console.log('Internship titles:', companyInternships.map(i => i.title));
      }

      const internshipIds = companyInternships.map(i => i._id);

      // Debug: Let's see what applications exist
      const allApplications = await this.applicationModel.find().select('internship student status');
      console.log('\nALL APPLICATIONS IN DB:');
      allApplications.forEach(app => {
        console.log(`  Application ID: ${app._id}`);
        console.log(`    Internship: ${app.internship}`);
        console.log(`    Internship type: ${typeof app.internship}`);
        console.log(`    Student: ${app.student}`);
        console.log(`    Status: ${app.status}`);
        
        // Check if this internship matches any of ours
        const matches = internshipIds.some(id => {
          const match1 = id.toString() === app.internship.toString();
          const match2 = id.equals(app.internship as any);
          console.log(`      Comparing ${id.toString()} with ${app.internship.toString()}: string=${match1}, equals=${match2}`);
          return match1 || match2;
        });
        console.log(`    Matches our company? ${matches}`);
      });

      // Try multiple query approaches
      console.log('\n=== TRYING DIFFERENT QUERIES ===');
      
      // Query 1: With ObjectId array
      const query1 = await this.applicationModel
        .find({ internship: { $in: internshipIds } })
        .select('_id internship');
      console.log('Query 1 ($in with ObjectId array):', query1.length, 'results');

      // Query 2: With string array
      const internshipIdStrings = internshipIds.map(id => id.toString());
      const query2 = await this.applicationModel
        .find({ internship: { $in: internshipIdStrings } })
        .select('_id internship');
      console.log('Query 2 ($in with string array):', query2.length, 'results');

      // Query 3: Try each ID individually
      for (const id of internshipIds) {
        const query3a = await this.applicationModel.find({ internship: id }).select('_id');
        const query3b = await this.applicationModel.find({ internship: id.toString() }).select('_id');
        console.log(`Query 3 (${id.toString()}): ObjectId=${query3a.length}, String=${query3b.length}`);
      }

      // Use whichever query worked
      let applications;
      if (query1.length > 0) {
        applications = await this.applicationModel
          .find({ internship: { $in: internshipIds } })
          .populate('student', 'username email')
          .populate({
            path: 'internship',
            populate: {
              path: 'company',
              select: 'name email website'
            }
          });
      } else if (query2.length > 0) {
        applications = await this.applicationModel
          .find({ internship: { $in: internshipIdStrings } })
          .populate('student', 'username email')
          .populate({
            path: 'internship',
            populate: {
              path: 'company',
              select: 'name email website'
            }
          });
      } else {
        applications = [];
      }

      console.log('Final applications found:', applications.length);
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
    // Validate ObjectId format first
    if (!Types.ObjectId.isValid(applicationId)) {
      throw new NotFoundException(`Invalid application ID format: ${applicationId}`);
    }

    // First, find the application and populate the internship
    const application = await this.applicationModel
      .findById(applicationId)
      .populate({
        path: 'internship',
        populate: {
          path: 'company',
          model: 'Company'
        }
      });

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
      const company = await this.companyModel.findOne({ 
        user: new Types.ObjectId(userId) 
      });
      
      if (!company) {
        throw new NotFoundException('Company profile not found');
      }

      const internship = application.internship as any;
      
      // Check if internship exists and has company populated
      if (!internship || !internship.company) {
        throw new NotFoundException('Internship or company information not found');
      }

      // Compare company IDs
      const internshipCompanyId = internship.company._id.toString();
      const userCompanyId = company._id.toString();

      console.log('=== UPDATE STATUS AUTHORIZATION CHECK ===');
      console.log('Application ID:', applicationId);
      console.log('Internship Company ID:', internshipCompanyId);
      console.log('User Company ID:', userCompanyId);
      console.log('Match:', internshipCompanyId === userCompanyId);
      console.log('=====================================');

      if (internshipCompanyId !== userCompanyId) {
        throw new ForbiddenException('You can only update applications for your own internships');
      }

      application.status = status;
      return application.save();
    }

    throw new ForbiddenException('Unauthorized to update application status');
  }
}