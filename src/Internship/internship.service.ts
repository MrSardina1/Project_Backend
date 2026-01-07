import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Internship, InternshipDocument } from 'src/Internship/internship.schema';
import { Model, Types } from 'mongoose';
import { CreateInternshipDto } from './dto/create-internship.dto';

@Injectable()
export class InternshipService {
  constructor(
    @InjectModel(Internship.name)
    private internshipModel: Model<InternshipDocument>,
  ) {}

  create(data: CreateInternshipDto, companyId: string) {
    // Ensure companyId is stored as ObjectId, not string
    return this.internshipModel.create({
      ...data,
      company: new Types.ObjectId(companyId),
    });
  }

  findAll() {
    return this.internshipModel
      .find()
      .populate('company', 'name website');
  }
}