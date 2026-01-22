"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const review_schema_1 = require("./review.schema");
const company_schema_1 = require("../company/company.schema");
const application_schema_1 = require("../Application/application.schema");
const internship_schema_1 = require("../Internship/internship.schema");
let ReviewService = class ReviewService {
    reviewModel;
    companyModel;
    applicationModel;
    internshipModel;
    constructor(reviewModel, companyModel, applicationModel, internshipModel) {
        this.reviewModel = reviewModel;
        this.companyModel = companyModel;
        this.applicationModel = applicationModel;
        this.internshipModel = internshipModel;
    }
    async create(userId, companyId, rating, comment) {
        if (!mongoose_2.Types.ObjectId.isValid(companyId)) {
            throw new common_1.NotFoundException(`Invalid company ID format: ${companyId}`);
        }
        const numRating = Number(rating);
        if (isNaN(numRating) || numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
            throw new common_1.BadRequestException('Rating must be a whole number between 1 and 5');
        }
        const company = await this.companyModel.findById(companyId);
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        const existingReview = await this.reviewModel.findOne({
            user: new mongoose_2.Types.ObjectId(userId),
            company: new mongoose_2.Types.ObjectId(companyId),
        });
        if (existingReview) {
            throw new common_1.BadRequestException('You have already reviewed this company');
        }
        const companyInternships = await this.internshipModel.find({
            company: new mongoose_2.Types.ObjectId(companyId)
        }).select('_id');
        const internshipIds = companyInternships.map(i => i._id);
        const acceptedApplication = await this.applicationModel.findOne({
            student: new mongoose_2.Types.ObjectId(userId),
            internship: { $in: internshipIds },
            status: application_schema_1.ApplicationStatus.ACCEPTED,
        });
        if (!acceptedApplication) {
            throw new common_1.ForbiddenException('You can only review companies where you have been accepted for an internship');
        }
        return this.reviewModel.create({
            user: new mongoose_2.Types.ObjectId(userId),
            company: new mongoose_2.Types.ObjectId(companyId),
            rating: numRating,
            comment: comment || '',
        });
    }
    async findByCompany(companyId) {
        if (!mongoose_2.Types.ObjectId.isValid(companyId)) {
            throw new common_1.NotFoundException(`Invalid company ID format: ${companyId}`);
        }
        const company = await this.companyModel.findById(companyId);
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        const reviews = await this.reviewModel
            .find({ company: new mongoose_2.Types.ObjectId(companyId) })
            .populate('user', 'username email profilePicture')
            .sort({ createdAt: -1 });
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
        return {
            company: {
                id: company._id,
                name: company.name,
                email: company.email,
                website: company.website,
                profilePicture: company.profilePicture,
            },
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: reviews.length,
            reviews,
        };
    }
    async findMyReviews(userId) {
        return this.reviewModel
            .find({ user: new mongoose_2.Types.ObjectId(userId) })
            .populate('company', 'name email website profilePicture')
            .sort({ createdAt: -1 });
    }
    async update(reviewId, userId, rating, comment) {
        if (!mongoose_2.Types.ObjectId.isValid(reviewId)) {
            throw new common_1.NotFoundException(`Invalid review ID format: ${reviewId}`);
        }
        const numRating = Number(rating);
        if (isNaN(numRating) || numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
            throw new common_1.BadRequestException('Rating must be a whole number between 1 and 5');
        }
        const review = await this.reviewModel.findById(reviewId);
        if (!review) {
            throw new common_1.NotFoundException('Review not found');
        }
        if (review.user.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only update your own reviews');
        }
        review.rating = numRating;
        review.comment = comment || '';
        return review.save();
    }
    async delete(reviewId, userId, userRole) {
        if (!mongoose_2.Types.ObjectId.isValid(reviewId)) {
            throw new common_1.NotFoundException(`Invalid review ID format: ${reviewId}`);
        }
        const review = await this.reviewModel.findById(reviewId);
        if (!review) {
            throw new common_1.NotFoundException('Review not found');
        }
        if (userRole !== 'ADMIN' && review.user.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own reviews');
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
            .populate('user', 'username email profilePicture')
            .populate('company', 'name email website')
            .sort({ createdAt: -1 });
    }
    async getAverageRating(companyId) {
        const reviews = await this.reviewModel.find({
            company: new mongoose_2.Types.ObjectId(companyId)
        });
        if (reviews.length === 0)
            return 0;
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        return Math.round((total / reviews.length) * 10) / 10;
    }
};
exports.ReviewService = ReviewService;
exports.ReviewService = ReviewService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(review_schema_1.Review.name)),
    __param(1, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __param(2, (0, mongoose_1.InjectModel)(application_schema_1.Application.name)),
    __param(3, (0, mongoose_1.InjectModel)(internship_schema_1.Internship.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ReviewService);
//# sourceMappingURL=review.service.js.map