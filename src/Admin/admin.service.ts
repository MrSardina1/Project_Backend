import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from 'src/user/user.schema';
import { Company, CompanyDocument, CompanyStatus } from 'src/company/company.schema';
import { Internship, InternshipDocument } from 'src/Internship/internship.schema';
import { Application, ApplicationDocument } from 'src/Application/application.schema';
import { Review, ReviewDocument } from 'src/Review/review.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Internship.name) private internshipModel: Model<InternshipDocument>,
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) { }

  async getDashboardStats() {
    const totalStudents = await this.userModel.countDocuments({ role: 'STUDENT' });
    const totalCompanies = await this.companyModel.countDocuments({ status: { $ne: CompanyStatus.PENDING } });
    const pendingCompanies = await this.companyModel.countDocuments({ status: CompanyStatus.PENDING });
    const totalInternships = await this.internshipModel.countDocuments();
    const totalApplications = await this.applicationModel.countDocuments();

    // Calculate average rating across all reviews
    const reviews = await this.reviewModel.find();
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return {
      totalStudents,
      totalCompanies,
      pendingCompanies,
      totalInternships,
      totalApplications,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length
    };
  }

  async getAllUsers(sortBy?: string, filterBy?: string, filterValue?: string, status?: string) {
    let query: any = { role: { $ne: 'COMPANY' } };

    // Handle Status Filter
    if (status === 'DELETED') {
      query.deletedAt = { $ne: null };
    } else if (status === 'ACTIVE') {
      query.isActive = true;
      query.deletedAt = null;
    } else if (status === 'INACTIVE') {
      query.isActive = false;
    }

    if (filterValue) {
      if (!filterBy) {
        query.$or = [
          { username: { $regex: filterValue, $options: 'i' } },
          { name: { $regex: filterValue, $options: 'i' } },
          { email: { $regex: filterValue, $options: 'i' } }
        ];
      } else if (filterBy === 'name') {
        query.$or = [
          { username: { $regex: filterValue, $options: 'i' } },
          { name: { $regex: filterValue, $options: 'i' } }
        ];
      } else if (filterBy === 'email') {
        query.email = { $regex: filterValue, $options: 'i' };
      } else if (filterBy === 'role') {
        query.role = { $regex: filterValue, $options: 'i' };
      }
    }

    let usersQuery = this.userModel.find(query).select('-password');

    if (sortBy === 'name') {
      usersQuery = usersQuery.sort({ username: 1 });
    } else if (sortBy === 'email') {
      usersQuery = usersQuery.sort({ email: 1 });
    } else {
      usersQuery = usersQuery.sort({ createdAt: -1 });
    }

    const users = await usersQuery.exec();

    // Map company data (profile picture and status)
    return Promise.all(users.map(async (user) => {
      const userObj: any = user.toObject();
      if (userObj.role === 'COMPANY') {
        const company = await this.companyModel.findOne({ user: user._id });
        if (company) {
          if (company.profilePicture) userObj.profilePicture = company.profilePicture;
          userObj.companyStatus = company.status;
          userObj.companyId = company._id;
        }
      }
      return userObj;
    }));
  }

  async getUserById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid user ID');
    }

    const user = await this.userModel.findById(id).select('-password');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUser(id: string, data: any) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid user ID');
    }

    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async deleteUser(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid user ID');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Toggle active state instead of deleting
    user.isActive = !user.isActive;
    await user.save();

    const status = user.isActive ? 'activated' : 'deactivated';
    return { message: `User ${status} successfully` };
  }

  async softDeleteUser(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid user ID');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.deletedAt = new Date();
    user.isActive = false;
    await user.save();

    if (user.role === 'COMPANY') {
      const company = await this.companyModel.findOne({ user: user._id });
      if (company) {
        company.deletedAt = new Date();
        await company.save();
      }
    }

    return { message: 'User deleted successfully (Soft Delete)' };
  }

  async restoreUser(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid user ID');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.deletedAt = null as any;
    user.isActive = true;
    await user.save();

    if (user.role === 'COMPANY') {
      const company = await this.companyModel.findOne({ user: user._id });
      if (company) {
        company.deletedAt = null as any;
        await company.save();
      }
    }

    return { message: 'User restored successfully' };
  }

  async createUser(data: any) {
    const { username, email, password, role, name, website, description } = data;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      username,
      email,
      password: hashedPassword,
      name: name || username,
      role: role || 'STUDENT',
      isActive: true,
      isEmailVerified: true,
    });

    await user.save();

    if (role === 'COMPANY') {
      const company = new this.companyModel({
        name: name || username,
        email: email,
        website: website || '',
        description: description || '',
        user: user._id,
        status: CompanyStatus.APPROVED,
      });
      await company.save();
    }

    return user;
  }

  async updateRole(id: string, newRole: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid user ID');
    }

    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: { role: newRole } },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getAllCompanies(sortBy?: string, filterBy?: string, filterValue?: string, status?: string) {
    let query: any = {};

    if (status) {
      if (status === 'DELETED') {
        query.deletedAt = { $ne: null };
      } else if (status === 'ACTIVE') {
        const users = await this.userModel.find({ isActive: true, role: 'COMPANY' });
        const userIds = users.map(u => u._id);
        query.user = { $in: userIds };
        query.deletedAt = null;
      } else if (status === 'INACTIVE') {
        const users = await this.userModel.find({ isActive: false, role: 'COMPANY' });
        const userIds = users.map(u => u._id);
        query.user = { $in: userIds };
        query.deletedAt = null;
      } else {
        query.status = status;
        query.deletedAt = null;
      }
    }

    if (filterBy && filterValue) {
      if (filterBy === 'name') {
        query.name = { $regex: filterValue, $options: 'i' };
      } else if (filterBy === 'email') {
        query.email = { $regex: filterValue, $options: 'i' };
      }
    }

    let companiesQuery = this.companyModel.find(query).populate('user', 'username email isActive profilePicture');

    if (sortBy === 'name') {
      companiesQuery = companiesQuery.sort({ name: 1 });
    } else if (sortBy === 'email') {
      companiesQuery = companiesQuery.sort({ email: 1 });
    } else {
      companiesQuery = companiesQuery.sort({ createdAt: -1 });
    }

    const companies = await companiesQuery.exec();

    return Promise.all(companies.map(async (company) => {
      const companyObj = company.toObject();

      const internshipCount = await this.internshipModel.countDocuments({ company: company._id });
      const reviewCount = await this.reviewModel.countDocuments({ company: company._id });

      // Get all internships for this company to count applications
      const internships = await this.internshipModel.find({ company: company._id }).select('_id');
      const internshipIds = internships.map(i => i._id);
      const applicationCount = await this.applicationModel.countDocuments({ internship: { $in: internshipIds } });

      return {
        ...companyObj,
        internshipCount,
        reviewCount,
        applicationCount
      };
    }));
  }

  async getPendingCompanies() {
    return this.companyModel
      .find({ status: CompanyStatus.PENDING, deletedAt: null })
      .populate('user', 'username email isActive profilePicture deletedAt')
      .sort({ createdAt: -1 });
  }

  async verifyCompany(id: string, status: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid company ID');
    }

    if (!Object.values(CompanyStatus).includes(status as CompanyStatus)) {
      throw new NotFoundException('Invalid status');
    }

    const company = await this.companyModel.findByIdAndUpdate(
      id,
      { status: status as CompanyStatus },
      { new: true }
    );

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async updateCompany(id: string, data: any) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid company ID');
    }

    const company = await this.companyModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async deleteCompany(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid company ID');
    }

    const company = await this.companyModel.findById(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Soft delete company
    company.deletedAt = new Date();
    await company.save();

    // Also deactivate the associated user if exists
    if (company.user) {
      const user = await this.userModel.findById(company.user);
      if (user) {
        user.isActive = false;
        user.deletedAt = new Date();
        await user.save();
      }
    }

    return { message: 'Company deleted successfully (Soft Delete)' };
  }

  async restoreCompany(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid company ID');
    }

    const company = await this.companyModel.findById(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    company.deletedAt = null as any;
    await company.save();

    if (company.user) {
      const user = await this.userModel.findById(company.user);
      if (user) {
        user.isActive = true;
        user.deletedAt = null as any;
        await user.save();
      }
    }

    return { message: 'Company restored successfully' };
  }

  async getAllInternships(sortBy?: string, filterBy?: string, filterValue?: string, companyId?: string) {
    let query: any = {};

    if (companyId && Types.ObjectId.isValid(companyId)) {
      query.company = new Types.ObjectId(companyId);
    }

    if (filterBy && filterValue) {
      if (filterBy === 'title') {
        query.title = { $regex: filterValue, $options: 'i' };
      } else if (filterBy === 'location') {
        query.location = { $regex: filterValue, $options: 'i' };
      }
    }

    let internshipsQuery = this.internshipModel
      .find(query)
      .populate({
        path: 'company',
        select: 'name email profilePicture user',
        populate: { path: 'user', select: 'profilePicture' }
      });

    if (sortBy === 'title') {
      internshipsQuery = internshipsQuery.sort({ title: 1 });
    } else if (sortBy === 'location') {
      internshipsQuery = internshipsQuery.sort({ location: 1 });
    } else {
      internshipsQuery = internshipsQuery.sort({ createdAt: -1 });
    }

    return internshipsQuery.exec();
  }

  async deleteInternship(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid internship ID');
    }

    const internship = await this.internshipModel.findByIdAndDelete(id);
    if (!internship) {
      throw new NotFoundException('Internship not found');
    }

    return { message: 'Internship deleted successfully' };
  }

  async getCompaniesWithInternshipCounts() {
    // Get all approved, non-deleted companies with active users
    const companies = await this.companyModel.find({
      status: CompanyStatus.APPROVED,
      deletedAt: null
    }).populate('user');

    // Filter out companies whose user is deactivated or deleted
    const filteredCompanies = companies.filter(c => {
      const user = c.user as any;
      return user && user.isActive && !user.deletedAt;
    });

    // For each company, count their internships
    const results = await Promise.all(filteredCompanies.map(async (company) => {
      const internshipCount = await this.internshipModel.countDocuments({ company: company._id });
      return {
        _id: company._id,
        name: company.name,
        email: company.email,
        internshipCount
      };
    }));

    // Sort by name
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getAllApplications() {
    return this.applicationModel
      .find()
      .populate('student', 'username email profilePicture')
      .populate({
        path: 'internship',
        populate: {
          path: 'company',
          select: 'name profilePicture user',
          populate: { path: 'user', select: 'profilePicture' }
        }
      })
      .sort({ createdAt: -1 });
  }

  async getAllReviews(companyId?: string, reviewerName?: string) {
    const query: any = {};

    if (companyId && Types.ObjectId.isValid(companyId)) {
      query.company = new Types.ObjectId(companyId);
    }

    if (reviewerName) {
      const users = await this.userModel.find({
        username: { $regex: reviewerName, $options: 'i' }
      }).select('_id');

      const userIds = users.map(u => u._id);
      query.user = { $in: userIds };
    }

    return this.reviewModel
      .find(query)
      .populate('user', 'username email profilePicture')
      .populate({
        path: 'company',
        select: 'name profilePicture user',
        populate: { path: 'user', select: 'profilePicture' }
      })
      .sort({ createdAt: -1 });
  }

  async getCompaniesWithReviewCounts() {
    const reviews = await this.reviewModel.aggregate([
      {
        $group: {
          _id: '$company',
          count: { $sum: 1 }
        }
      }
    ]);

    const companies = await this.companyModel.find({
      status: CompanyStatus.APPROVED,
      deletedAt: null
    })
      .select('name user')
      .populate('user', 'isActive');

    const activeCompanies = companies.filter(company => {
      const user = company.user as any;
      return user && user.isActive === true;
    });

    return activeCompanies.map(company => {
      const stat = reviews.find(r => r._id.toString() === company._id.toString());
      return {
        _id: company._id,
        name: company.name,
        reviewCount: stat ? stat.count : 0
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  async deleteReview(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid review ID');
    }

    const review = await this.reviewModel.findByIdAndDelete(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return { message: 'Review deleted successfully' };
  }

  async getActiveCompanies() {
    const companies = await this.companyModel.find({
      status: CompanyStatus.APPROVED,
      deletedAt: null
    }).select('name user')
      .populate('user', 'isActive deletedAt');

    return companies.filter(company => {
      const user = company.user as any;
      return user && user.isActive === true && !user.deletedAt;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }
}