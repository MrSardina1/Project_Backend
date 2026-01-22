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
exports.InternshipService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const internship_schema_1 = require("./internship.schema");
const application_schema_1 = require("../Application/application.schema");
const mongoose_2 = require("mongoose");
let InternshipService = class InternshipService {
    internshipModel;
    applicationModel;
    constructor(internshipModel, applicationModel) {
        this.internshipModel = internshipModel;
        this.applicationModel = applicationModel;
    }
    create(data, companyId) {
        return this.internshipModel.create({
            ...data,
            company: new mongoose_2.Types.ObjectId(companyId),
        });
    }
    async findAll(userId) {
        const internships = await this.internshipModel
            .find()
            .populate('company', 'name website profilePicture')
            .lean();
        const internshipsWithCounts = await Promise.all(internships.map(async (internship) => {
            const applicationCount = await this.applicationModel.countDocuments({
                internship: internship._id
            });
            let userApplicationStatus = undefined;
            if (userId) {
                const userApplication = await this.applicationModel.findOne({
                    internship: internship._id,
                    student: new mongoose_2.Types.ObjectId(userId)
                });
                if (userApplication) {
                    userApplicationStatus = userApplication.status;
                }
            }
            return {
                ...internship,
                _id: internship._id.toString(),
                applicationCount,
                userApplicationStatus
            };
        }));
        return internshipsWithCounts;
    }
    async findByCompany(companyId) {
        const internships = await this.internshipModel
            .find({ company: new mongoose_2.Types.ObjectId(companyId) })
            .lean();
        const internshipsWithCounts = await Promise.all(internships.map(async (internship) => {
            const applicationCount = await this.applicationModel.countDocuments({
                internship: internship._id
            });
            return {
                ...internship,
                _id: internship._id.toString(),
                applicationCount
            };
        }));
        return internshipsWithCounts;
    }
    async getInternshipWithApplications(internshipId) {
        const internship = await this.internshipModel
            .findById(internshipId)
            .populate('company', 'name email website profilePicture');
        if (!internship) {
            return null;
        }
        const applications = await this.applicationModel
            .find({ internship: new mongoose_2.Types.ObjectId(internshipId) })
            .populate('student', 'username email profilePicture')
            .sort({ createdAt: -1 });
        return {
            internship,
            applications
        };
    }
};
exports.InternshipService = InternshipService;
exports.InternshipService = InternshipService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(internship_schema_1.Internship.name)),
    __param(1, (0, mongoose_1.InjectModel)(application_schema_1.Application.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], InternshipService);
//# sourceMappingURL=internship.service.js.map