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
exports.ApplicationService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const application_schema_1 = require("./application.schema");
const internship_schema_1 = require("../Internship/internship.schema");
const company_schema_1 = require("../company/company.schema");
const roles_enum_1 = require("../Auth/roles.enum");
let ApplicationService = class ApplicationService {
    applicationModel;
    internshipModel;
    companyModel;
    constructor(applicationModel, internshipModel, companyModel) {
        this.applicationModel = applicationModel;
        this.internshipModel = internshipModel;
        this.companyModel = companyModel;
    }
    async apply(studentId, internshipId) {
        if (!mongoose_2.Types.ObjectId.isValid(internshipId)) {
            throw new common_1.NotFoundException(`Invalid internship ID format: ${internshipId}`);
        }
        const internship = await this.internshipModel.findById(internshipId);
        if (!internship) {
            throw new common_1.NotFoundException('Internship not found');
        }
        const existingApplication = await this.applicationModel.findOne({
            student: new mongoose_2.Types.ObjectId(studentId),
            internship: new mongoose_2.Types.ObjectId(internshipId),
        });
        if (existingApplication) {
            if (existingApplication.status === application_schema_1.ApplicationStatus.PENDING) {
                throw new common_1.BadRequestException('You have already applied for this internship and your application is still pending');
            }
            if (existingApplication.status === application_schema_1.ApplicationStatus.ACCEPTED) {
                throw new common_1.BadRequestException('You have already been accepted for this internship');
            }
            if (existingApplication.status === application_schema_1.ApplicationStatus.REJECTED) {
                await this.applicationModel.findByIdAndDelete(existingApplication._id);
            }
            else {
                throw new common_1.BadRequestException('You have already applied for this internship');
            }
        }
        return this.applicationModel.create({
            student: new mongoose_2.Types.ObjectId(studentId),
            internship: new mongoose_2.Types.ObjectId(internshipId),
        });
    }
    async getMyApplications(studentId) {
        return this.applicationModel
            .find({ student: new mongoose_2.Types.ObjectId(studentId) })
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
    async findAll(userId, userRole) {
        if (userRole === roles_enum_1.Role.ADMIN) {
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
        if (userRole === roles_enum_1.Role.COMPANY) {
            const company = await this.companyModel.findOne({
                user: new mongoose_2.Types.ObjectId(userId)
            });
            if (!company) {
                throw new common_1.NotFoundException('Company profile not found');
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
        if (userRole === roles_enum_1.Role.STUDENT) {
            return this.getMyApplications(userId);
        }
        throw new common_1.ForbiddenException('Unauthorized to view applications');
    }
    async updateStatus(applicationId, status, userId, userRole) {
        if (!mongoose_2.Types.ObjectId.isValid(applicationId)) {
            throw new common_1.NotFoundException(`Invalid application ID format: ${applicationId}`);
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
            throw new common_1.NotFoundException('Application not found');
        }
        if (userRole === roles_enum_1.Role.ADMIN) {
            application.status = status;
            return application.save();
        }
        if (userRole === roles_enum_1.Role.COMPANY) {
            const company = await this.companyModel.findOne({
                user: new mongoose_2.Types.ObjectId(userId)
            });
            if (!company) {
                throw new common_1.NotFoundException('Company profile not found');
            }
            const internship = application.internship;
            if (!internship || !internship.company) {
                throw new common_1.NotFoundException('Internship or company information not found');
            }
            const internshipCompanyId = internship.company._id.toString();
            const userCompanyId = company._id.toString();
            if (internshipCompanyId !== userCompanyId) {
                throw new common_1.ForbiddenException('You can only update applications for your own internships');
            }
            application.status = status;
            return application.save();
        }
        throw new common_1.ForbiddenException('Unauthorized to update application status');
    }
    async getApplicationCount(internshipId) {
        return this.applicationModel.countDocuments({
            internship: new mongoose_2.Types.ObjectId(internshipId)
        });
    }
    async getAcceptedCompanies(studentId) {
        const acceptedApplications = await this.applicationModel
            .find({
            student: new mongoose_2.Types.ObjectId(studentId),
            status: application_schema_1.ApplicationStatus.ACCEPTED
        })
            .populate({
            path: 'internship',
            populate: {
                path: 'company',
                select: 'name email website description profilePicture'
            }
        });
        const companiesMap = new Map();
        acceptedApplications.forEach(app => {
            const internship = app.internship;
            if (internship && internship.company) {
                const company = internship.company;
                if (!companiesMap.has(company._id.toString())) {
                    companiesMap.set(company._id.toString(), company);
                }
            }
        });
        return Array.from(companiesMap.values());
    }
};
exports.ApplicationService = ApplicationService;
exports.ApplicationService = ApplicationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(application_schema_1.Application.name)),
    __param(1, (0, mongoose_1.InjectModel)(internship_schema_1.Internship.name)),
    __param(2, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ApplicationService);
//# sourceMappingURL=application.service.js.map