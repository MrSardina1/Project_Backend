import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
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
  ) { }

  async apply(studentId: string, internshipId: string) {
    if (!Types.ObjectId.isValid(internshipId)) {
      throw new NotFoundException(`Invalid internship ID format: ${internshipId}`);
    }

    const internship = await this.internshipModel.findById(internshipId);
    if (!internship) {
      throw new NotFoundException('Internship not found');
    }

    // Check if student already applied
    const existingApplication = await this.applicationModel.findOne({
      student: new Types.ObjectId(studentId),
      internship: new Types.ObjectId(internshipId),
    });

    if (existingApplication) {
      if (existingApplication.status === ApplicationStatus.PENDING) {
        throw new BadRequestException('You have already applied for this internship and your application is still pending');
      }
      if (existingApplication.status === ApplicationStatus.ACCEPTED) {
        throw new BadRequestException('You have already been accepted for this internship');
      }
      if (existingApplication.status === ApplicationStatus.REJECTED) {
        // If rejected, delete the old application to allow re-application
        await this.applicationModel.findByIdAndDelete(existingApplication._id);
      } else {
        throw new BadRequestException('You have already applied for this internship');
      }
    }

    return this.applicationModel.create({
      student: new Types.ObjectId(studentId),
      internship: new Types.ObjectId(internshipId),
    });
  }

  // FIX: Add method to get student's applications
  async getMyApplications(studentId: string) {
    return this.applicationModel
      .find({ student: new Types.ObjectId(studentId) })
      .populate('internship')
      .populate({
        path: 'internship',
        populate: {
          path: 'company',
          select: 'name email website profilePicture'
        }
      })
      .sort({ createdAt: -1 });
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
            select: 'name email website profilePicture'
          }
        });
    }

    if (userRole === Role.COMPANY) {
      const company = await this.companyModel.findOne({
        user: new Types.ObjectId(userId)
      });

      if (!company) {
        throw new NotFoundException('Company profile not found');
      }

      const companyInternships = await this.internshipModel
        .find({ company: company._id })
        .select('_id');

      const internshipIds = companyInternships.map(i => i._id);

      return this.applicationModel
        .find({ internship: { $in: internshipIds } })
        .populate('student', 'username email')
        .populate({
          path: 'internship',
          populate: {
            path: 'company',
            select: 'name email website profilePicture'
          }
        })
        .sort({ createdAt: -1 });
    }

    // FIX: Students can now see their own applications
    if (userRole === Role.STUDENT) {
      return this.getMyApplications(userId);
    }

    throw new ForbiddenException('Unauthorized to view applications');
  }

  async updateStatus(
    applicationId: string,
    status: ApplicationStatus,
    userId: string,
    userRole: Role,
  ) {
    if (!Types.ObjectId.isValid(applicationId)) {
      throw new NotFoundException(`Invalid application ID format: ${applicationId}`);
    }

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

    if (userRole === Role.ADMIN) {
      application.status = status;
      return application.save();
    }

    if (userRole === Role.COMPANY) {
      const company = await this.companyModel.findOne({
        user: new Types.ObjectId(userId)
      });

      if (!company) {
        throw new NotFoundException('Company profile not found');
      }

      const internship = application.internship as any;

      if (!internship || !internship.company) {
        throw new NotFoundException('Internship or company information not found');
      }

      const internshipCompanyId = internship.company._id.toString();
      const userCompanyId = company._id.toString();

      if (internshipCompanyId !== userCompanyId) {
        throw new ForbiddenException('You can only update applications for your own internships');
      }

      application.status = status;
      return application.save();
    }

    throw new ForbiddenException('Unauthorized to update application status');
  }

  // NEW: Get application count for an internship
  async getApplicationCount(internshipId: string): Promise<number> {
    return this.applicationModel.countDocuments({
      internship: new Types.ObjectId(internshipId)
    });
  }

  // NEW: Get accepted companies for a student
  async getAcceptedCompanies(studentId: string) {
    const acceptedApplications = await this.applicationModel
      .find({
        student: new Types.ObjectId(studentId),
        status: ApplicationStatus.ACCEPTED
      })
      .populate({
        path: 'internship',
        populate: {
          path: 'company',
          select: 'name email website description profilePicture'
        }
      });

    // Extract unique companies
    const companiesMap = new Map();
    acceptedApplications.forEach(app => {
      const internship = app.internship as any;
      if (internship && internship.company) {
        const company = internship.company;
        if (!companiesMap.has(company._id.toString())) {
          companiesMap.set(company._id.toString(), company);
        }
      }
    });

    return Array.from(companiesMap.values());
  }
}