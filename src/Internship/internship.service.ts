import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Internship, InternshipDocument } from 'src/Internship/internship.schema';
import { Application, ApplicationDocument } from 'src/Application/application.schema';
import { Model, Types } from 'mongoose';
import { CreateInternshipDto } from './dto/create-internship.dto';

export interface InternshipWithCount {
  _id: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  company: any;
  createdAt: string;
  applicationCount: number;
}

@Injectable()
export class InternshipService {
  constructor(
    @InjectModel(Internship.name)
    private internshipModel: Model<InternshipDocument>,
    @InjectModel(Application.name)
    private applicationModel: Model<ApplicationDocument>,
  ) {}

  create(data: CreateInternshipDto, companyId: string) {
    return this.internshipModel.create({
      ...data,
      company: new Types.ObjectId(companyId),
    });
  }

  async findAll(): Promise<InternshipWithCount[]> {
    const internships = await this.internshipModel
      .find()
      .populate('company', 'name website profilePicture')
      .lean();

    const internshipsWithCounts = await Promise.all(
      internships.map(async (internship: any) => {
        const applicationCount = await this.applicationModel.countDocuments({
          internship: internship._id
        });
        return {
          ...internship,
          _id: internship._id.toString(),
          applicationCount
        } as InternshipWithCount;
      })
    );

    return internshipsWithCounts;
  }

  async findByCompany(companyId: string): Promise<InternshipWithCount[]> {
    const internships = await this.internshipModel
      .find({ company: new Types.ObjectId(companyId) })
      .lean();

    const internshipsWithCounts = await Promise.all(
      internships.map(async (internship: any) => {
        const applicationCount = await this.applicationModel.countDocuments({
          internship: internship._id
        });
        return {
          ...internship,
          _id: internship._id.toString(),
          applicationCount
        } as InternshipWithCount;
      })
    );

    return internshipsWithCounts;
  }

  async getInternshipWithApplications(internshipId: string) {
    const internship = await this.internshipModel
      .findById(internshipId)
      .populate('company', 'name email website profilePicture');

    if (!internship) {
      return null;
    }

    const applications = await this.applicationModel
      .find({ internship: new Types.ObjectId(internshipId) })
      .populate('student', 'username email profilePicture')
      .sort({ createdAt: -1 });

    return {
      internship,
      applications
    };
  }
}