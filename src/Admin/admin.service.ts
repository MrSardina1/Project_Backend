import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/user/user.schema';
import { Company, CompanyDocument, CompanyStatus } from 'src/company/company.schema';
import { Internship, InternshipDocument } from 'src/Internship/internship.schema';
import { Application, ApplicationDocument } from 'src/Application/application.schema';
import { Review, ReviewDocument } from 'src/Review/review.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Internship.name) private internshipModel: Model<InternshipDocument>,
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) { }

  async getDashboardStats() {
    const totalStudents = await this.userModel.countDocuments({ role: 'STUDENT' });
    const totalCompanies = await this.companyModel.countDocuments({ status: CompanyStatus.APPROVED });
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

  async getAllUsers(sortBy?: string, filterBy?: string, filterValue?: string) {
    let query: any = {};

    if (filterBy && filterValue) {
      if (filterBy === 'name') {
        query.username = { $regex: filterValue, $options: 'i' };
      } else if (filterBy === 'email') {
        query.email = { $regex: filterValue, $options: 'i' };
      } else if (filterBy === 'role') {
        query.role = filterValue;
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

    // Map company profile pictures
    return Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      if (userObj.role === 'COMPANY') {
        const company = await this.companyModel.findOne({ user: user._id });
        if (company && company.profilePicture) {
          userObj.profilePicture = company.profilePicture;
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

  async getAllCompanies(sortBy?: string, filterBy?: string, filterValue?: string, status?: string) {
    let query: any = {};

    if (status) {
      query.status = status;
    }

    if (filterBy && filterValue) {
      if (filterBy === 'name') {
        query.name = { $regex: filterValue, $options: 'i' };
      } else if (filterBy === 'email') {
        query.email = { $regex: filterValue, $options: 'i' };
      }
    }

    let companiesQuery = this.companyModel.find(query).populate('user', 'username email');

    if (sortBy === 'name') {
      companiesQuery = companiesQuery.sort({ name: 1 });
    } else if (sortBy === 'email') {
      companiesQuery = companiesQuery.sort({ email: 1 });
    } else {
      companiesQuery = companiesQuery.sort({ createdAt: -1 });
    }

    return companiesQuery.exec();
  }

  async getPendingCompanies() {
    return this.companyModel
      .find({ status: CompanyStatus.PENDING })
      .populate('user', 'username email')
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

    const company = await this.companyModel.findByIdAndDelete(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return { message: 'Company deleted successfully' };
  }

  async getAllInternships(sortBy?: string, filterBy?: string, filterValue?: string) {
    let query: any = {};

    if (filterBy && filterValue) {
      if (filterBy === 'title') {
        query.title = { $regex: filterValue, $options: 'i' };
      } else if (filterBy === 'location') {
        query.location = { $regex: filterValue, $options: 'i' };
      }
    }

    let internshipsQuery = this.internshipModel
      .find(query)
      .populate('company', 'name email');

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

  async getAllApplications() {
    return this.applicationModel
      .find()
      .populate('student', 'username email')
      .populate({
        path: 'internship',
        populate: { path: 'company', select: 'name' }
      })
      .sort({ createdAt: -1 });
  }

  async getAllReviews() {
    return this.reviewModel
      .find()
      .populate('user', 'username email')
      .populate('company', 'name')
      .sort({ createdAt: -1 });
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
}