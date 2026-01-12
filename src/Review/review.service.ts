import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './review.schema';
import { Company, CompanyDocument } from 'src/company/company.schema';
import { Application, ApplicationDocument, ApplicationStatus } from 'src/Application/application.schema';
import { Internship, InternshipDocument } from 'src/Internship/internship.schema';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name)
    private reviewModel: Model<ReviewDocument>,
    @InjectModel(Company.name)
    private companyModel: Model<CompanyDocument>,
    @InjectModel(Application.name)
    private applicationModel: Model<ApplicationDocument>,
    @InjectModel(Internship.name)
    private internshipModel: Model<InternshipDocument>,
  ) {}

  async create(userId: string, companyId: string, rating: number, comment?: string) {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new NotFoundException(`Invalid company ID format: ${companyId}`);
    }

    // Convert and validate rating
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
      throw new BadRequestException('Rating must be a whole number between 1 and 5');
    }

    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if user already reviewed this company
    const existingReview = await this.reviewModel.findOne({
      user: new Types.ObjectId(userId),
      company: new Types.ObjectId(companyId),
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this company');
    }

    // Get all internships for this company
    const companyInternships = await this.internshipModel.find({
      company: new Types.ObjectId(companyId)
    }).select('_id');

    const internshipIds = companyInternships.map(i => i._id);

    // Check if student has ANY accepted application for ANY of this company's internships
    const acceptedApplication = await this.applicationModel.findOne({
      student: new Types.ObjectId(userId),
      internship: { $in: internshipIds },
      status: ApplicationStatus.ACCEPTED,
    });

    if (!acceptedApplication) {
      throw new ForbiddenException(
        'You can only review companies where you have been accepted for an internship'
      );
    }

    return this.reviewModel.create({
      user: new Types.ObjectId(userId),
      company: new Types.ObjectId(companyId),
      rating: numRating,
      comment: comment || '',
    });
  }

  async findByCompany(companyId: string) {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new NotFoundException(`Invalid company ID format: ${companyId}`);
    }

    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const reviews = await this.reviewModel
      .find({ company: new Types.ObjectId(companyId) })
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return {
      company: {
        id: company._id,
        name: company.name,
        email: company.email,
        website: company.website,
      },
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      reviews,
    };
  }

  async findMyReviews(userId: string) {
    return this.reviewModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('company', 'name email website')
      .sort({ createdAt: -1 });
  }

  async update(reviewId: string, userId: string, rating: number, comment?: string) {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new NotFoundException(`Invalid review ID format: ${reviewId}`);
    }

    // Convert and validate rating
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
      throw new BadRequestException('Rating must be a whole number between 1 and 5');
    }

    const review = await this.reviewModel.findById(reviewId);
    
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.user.toString() !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    review.rating = numRating;
    review.comment = comment || '';

    return review.save();
  }

  async delete(reviewId: string, userId: string, userRole: string) {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new NotFoundException(`Invalid review ID format: ${reviewId}`);
    }

    const review = await this.reviewModel.findById(reviewId);
    
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (userRole !== 'ADMIN' && review.user.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewModel.findByIdAndDelete(reviewId);
    
    return { 
      message: 'Review deleted successfully',
      deletedReview: {
        id: review._id,
        rating: review.rating,
        comment: review.comment,
      }
    };
  }

  async findAll() {
    return this.reviewModel
      .find()
      .populate('user', 'username email')
      .populate('company', 'name email website')
      .sort({ createdAt: -1 });
  }

  async getAverageRating(companyId: string): Promise<number> {
    const reviews = await this.reviewModel.find({ 
      company: new Types.ObjectId(companyId) 
    });
    
    if (reviews.length === 0) return 0;
    
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }
}