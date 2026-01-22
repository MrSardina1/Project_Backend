"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../user/user.schema");
const company_schema_1 = require("../company/company.schema");
const internship_schema_1 = require("../Internship/internship.schema");
const application_schema_1 = require("../Application/application.schema");
const review_schema_1 = require("../Review/review.schema");
let AdminService = class AdminService {
    userModel;
    companyModel;
    internshipModel;
    applicationModel;
    reviewModel;
    constructor(userModel, companyModel, internshipModel, applicationModel, reviewModel) {
        this.userModel = userModel;
        this.companyModel = companyModel;
        this.internshipModel = internshipModel;
        this.applicationModel = applicationModel;
        this.reviewModel = reviewModel;
    }
    async getDashboardStats() {
        const totalStudents = await this.userModel.countDocuments({ role: 'STUDENT' });
        const totalCompanies = await this.companyModel.countDocuments({ status: { $ne: company_schema_1.CompanyStatus.PENDING } });
        const pendingCompanies = await this.companyModel.countDocuments({ status: company_schema_1.CompanyStatus.PENDING });
        const totalInternships = await this.internshipModel.countDocuments();
        const totalApplications = await this.applicationModel.countDocuments();
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
    async getAllUsers(sortBy, filterBy, filterValue, status) {
        let query = { role: { $ne: 'COMPANY' } };
        if (status === 'DELETED') {
            query.deletedAt = { $ne: null };
        }
        else if (status === 'ACTIVE') {
            query.isActive = true;
            query.deletedAt = null;
        }
        else if (status === 'INACTIVE') {
            query.isActive = false;
        }
        if (filterValue) {
            if (!filterBy) {
                query.$or = [
                    { username: { $regex: filterValue, $options: 'i' } },
                    { name: { $regex: filterValue, $options: 'i' } },
                    { email: { $regex: filterValue, $options: 'i' } }
                ];
            }
            else if (filterBy === 'name') {
                query.$or = [
                    { username: { $regex: filterValue, $options: 'i' } },
                    { name: { $regex: filterValue, $options: 'i' } }
                ];
            }
            else if (filterBy === 'email') {
                query.email = { $regex: filterValue, $options: 'i' };
            }
            else if (filterBy === 'role') {
                query.role = { $regex: filterValue, $options: 'i' };
            }
        }
        let usersQuery = this.userModel.find(query).select('-password');
        if (sortBy === 'name') {
            usersQuery = usersQuery.sort({ username: 1 });
        }
        else if (sortBy === 'email') {
            usersQuery = usersQuery.sort({ email: 1 });
        }
        else {
            usersQuery = usersQuery.sort({ createdAt: -1 });
        }
        const users = await usersQuery.exec();
        return Promise.all(users.map(async (user) => {
            const userObj = user.toObject();
            if (userObj.role === 'COMPANY') {
                const company = await this.companyModel.findOne({ user: user._id });
                if (company) {
                    if (company.profilePicture)
                        userObj.profilePicture = company.profilePicture;
                    userObj.companyStatus = company.status;
                    userObj.companyId = company._id;
                }
            }
            return userObj;
        }));
    }
    async getUserById(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Invalid user ID');
        }
        const user = await this.userModel.findById(id).select('-password');
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async updateUser(id, data) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Invalid user ID');
        }
        const user = await this.userModel.findByIdAndUpdate(id, { $set: data }, { new: true }).select('-password');
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async deleteUser(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Invalid user ID');
        }
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.isActive = !user.isActive;
        await user.save();
        const status = user.isActive ? 'activated' : 'deactivated';
        return { message: `User ${status} successfully` };
    }
    async softDeleteUser(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Invalid user ID');
        }
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
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
    async restoreUser(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Invalid user ID');
        }
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.deletedAt = null;
        user.isActive = true;
        await user.save();
        if (user.role === 'COMPANY') {
            const company = await this.companyModel.findOne({ user: user._id });
            if (company) {
                company.deletedAt = null;
                await company.save();
            }
        }
        return { message: 'User restored successfully' };
    }
    async createUser(data) {
        const { username, email, password, role, name, website, description } = data;
        const existingUser = await this.userModel.findOne({ email });
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
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
                status: company_schema_1.CompanyStatus.APPROVED,
            });
            await company.save();
        }
        return user;
    }
    async updateRole(id, newRole) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Invalid user ID');
        }
        const user = await this.userModel.findByIdAndUpdate(id, { $set: { role: newRole } }, { new: true }).select('-password');
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async getAllCompanies(sortBy, filterBy, filterValue, status) {
        let query = {};
        if (status) {
            if (status === 'DELETED') {
                query.deletedAt = { $ne: null };
            }
            else if (status === 'ACTIVE') {
                const users = await this.userModel.find({ isActive: true, role: 'COMPANY' });
                const userIds = users.map(u => u._id);
                query.user = { $in: userIds };
                query.deletedAt = null;
            }
            else if (status === 'INACTIVE') {
                const users = await this.userModel.find({ isActive: false, role: 'COMPANY' });
                const userIds = users.map(u => u._id);
                query.user = { $in: userIds };
                query.deletedAt = null;
            }
            else {
                query.status = status;
                query.deletedAt = null;
            }
        }
        if (filterBy && filterValue) {
            if (filterBy === 'name') {
                query.name = { $regex: filterValue, $options: 'i' };
            }
            else if (filterBy === 'email') {
                query.email = { $regex: filterValue, $options: 'i' };
            }
        }
        let companiesQuery = this.companyModel.find(query).populate('user', 'username email isActive profilePicture');
        if (sortBy === 'name') {
            companiesQuery = companiesQuery.sort({ name: 1 });
        }
        else if (sortBy === 'email') {
            companiesQuery = companiesQuery.sort({ email: 1 });
        }
        else {
            companiesQuery = companiesQuery.sort({ createdAt: -1 });
        }
        const companies = await companiesQuery.exec();
        return Promise.all(companies.map(async (company) => {
            const companyObj = company.toObject();
            const internshipCount = await this.internshipModel.countDocuments({ company: company._id });
            const reviewCount = await this.reviewModel.countDocuments({ company: company._id });
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
            .find({ status: company_schema_1.CompanyStatus.PENDING, deletedAt: null })
            .populate('user', 'username email isActive profilePicture deletedAt')
            .sort({ createdAt: -1 });
    }
    async verifyCompany(id, status) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Invalid company ID');
        }
        if (!Object.values(company_schema_1.CompanyStatus).includes(status)) {
            throw new common_1.NotFoundException('Invalid status');
        }
        const company = await this.companyModel.findByIdAndUpdate(id, { status: status }, { new: true });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        return company;
    }
    async updateCompany(id, data) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Invalid company ID');
        }
        const company = await this.companyModel.findByIdAndUpdate(id, { $set: data }, { new: true });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        return company;
    }
    async deleteCompany(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Invalid company ID');
        }
        const company = await this.companyModel.findById(id);
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        company.deletedAt = new Date();
        await company.save();
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
    async restoreCompany(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Invalid company ID');
        }
        const company = await this.companyModel.findById(id);
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        company.deletedAt = null;
        await company.save();
        if (company.user) {
            const user = await this.userModel.findById(company.user);
            if (user) {
                user.isActive = true;
                user.deletedAt = null;
                await user.save();
            }
        }
        return { message: 'Company restored successfully' };
    }
    async getAllInternships(sortBy, filterBy, filterValue, companyId) {
        let query = {};
        if (companyId && mongoose_2.Types.ObjectId.isValid(companyId)) {
            query.company = new mongoose_2.Types.ObjectId(companyId);
        }
        if (filterBy && filterValue) {
            if (filterBy === 'title') {
                query.title = { $regex: filterValue, $options: 'i' };
            }
            else if (filterBy === 'location') {
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
        }
        else if (sortBy === 'location') {
            internshipsQuery = internshipsQuery.sort({ location: 1 });
        }
        else {
            internshipsQuery = internshipsQuery.sort({ createdAt: -1 });
        }
        return internshipsQuery.exec();
    }
    async deleteInternship(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Invalid internship ID');
        }
        const internship = await this.internshipModel.findByIdAndDelete(id);
        if (!internship) {
            throw new common_1.NotFoundException('Internship not found');
        }
        return { message: 'Internship deleted successfully' };
    }
    async getCompaniesWithInternshipCounts() {
        const companies = await this.companyModel.find({
            status: company_schema_1.CompanyStatus.APPROVED,
            deletedAt: null
        }).populate('user');
        const filteredCompanies = companies.filter(c => {
            const user = c.user;
            return user && user.isActive && !user.deletedAt;
        });
        const results = await Promise.all(filteredCompanies.map(async (company) => {
            const internshipCount = await this.internshipModel.countDocuments({ company: company._id });
            return {
                _id: company._id,
                name: company.name,
                email: company.email,
                internshipCount
            };
        }));
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
    async getAllReviews(companyId, reviewerName) {
        const query = {};
        if (companyId && mongoose_2.Types.ObjectId.isValid(companyId)) {
            query.company = new mongoose_2.Types.ObjectId(companyId);
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
            status: company_schema_1.CompanyStatus.APPROVED,
            deletedAt: null
        })
            .select('name user')
            .populate('user', 'isActive');
        const activeCompanies = companies.filter(company => {
            const user = company.user;
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
    async deleteReview(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Invalid review ID');
        }
        const review = await this.reviewModel.findByIdAndDelete(id);
        if (!review) {
            throw new common_1.NotFoundException('Review not found');
        }
        return { message: 'Review deleted successfully' };
    }
    async getActiveCompanies() {
        const companies = await this.companyModel.find({
            status: company_schema_1.CompanyStatus.APPROVED,
            deletedAt: null
        }).select('name user')
            .populate('user', 'isActive deletedAt');
        return companies.filter(company => {
            const user = company.user;
            return user && user.isActive === true && !user.deletedAt;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __param(2, (0, mongoose_1.InjectModel)(internship_schema_1.Internship.name)),
    __param(3, (0, mongoose_1.InjectModel)(application_schema_1.Application.name)),
    __param(4, (0, mongoose_1.InjectModel)(review_schema_1.Review.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], AdminService);
//# sourceMappingURL=admin.service.js.map