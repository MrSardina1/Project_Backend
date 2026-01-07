import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from 'src/company/company.schema';
import { User } from 'src/user/user.schema';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/Auth/roles.enum';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name)
    private companyModel: Model<CompanyDocument>,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async create(data: any) {
    // Check if user with this email already exists
    const existingUser = await this.userModel.findOne({ email: data.email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if company with this email already exists
    const existingCompany = await this.companyModel.findOne({ email: data.email });
    if (existingCompany) {
      throw new ConflictException('Company with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Create user account with COMPANY role
    const user = await this.userModel.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: Role.COMPANY,
    });

    // Create company profile linked to user
    const company = await this.companyModel.create({
      name: data.name,
      description: data.description,
      email: data.email,
      website: data.website,
      user: user._id, // Link to user account
    });

    return {
      message: 'Company registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      company: {
        id: company._id,
        name: company.name,
        email: company.email,
      },
    };
  }

  // Helper method to link an existing user to a company
  async linkUserToCompany(userId: string, companyData: any) {
    // Verify user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has a company
    const existingCompany = await this.companyModel.findOne({ user: userId });
    if (existingCompany) {
      throw new ConflictException('This user is already linked to a company');
    }

    // Check if company email already exists
    const emailExists = await this.companyModel.findOne({ email: companyData.email });
    if (emailExists) {
      throw new ConflictException('Company with this email already exists');
    }

    // Create company linked to user
    const company = await this.companyModel.create({
      name: companyData.name,
      description: companyData.description,
      email: companyData.email,
      website: companyData.website,
      user: userId,
    });

    return {
      message: 'Company linked to user successfully',
      company: {
        id: company._id,
        name: company.name,
        email: company.email,
      },
    };
  }

  findAll() {
    return this.companyModel.find().populate('user', 'username email');
  }
}