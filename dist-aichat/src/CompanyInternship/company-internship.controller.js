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
exports.CompanyInternshipController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../Auth/jwt.auth.guard");
const roles_guard_1 = require("../Auth/roles.guard");
const roles_decorator_1 = require("../Auth/roles.decorator");
const roles_enum_1 = require("../Auth/roles.enum");
const internship_service_1 = require("../Internship/internship.service");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const company_schema_1 = require("../company/company.schema");
let CompanyInternshipController = class CompanyInternshipController {
    internshipService;
    companyModel;
    constructor(internshipService, companyModel) {
        this.internshipService = internshipService;
        this.companyModel = companyModel;
    }
    async getMyInternships(req) {
        const company = await this.companyModel.findOne({
            user: new mongoose_2.Types.ObjectId(req.user.userId)
        });
        if (!company) {
            throw new common_1.NotFoundException('Company profile not found');
        }
        return this.internshipService.findByCompany(company._id.toString());
    }
    async getInternshipApplications(req, internshipId, sortBy, filterBy, filterValue) {
        if (!mongoose_2.Types.ObjectId.isValid(internshipId)) {
            throw new common_1.NotFoundException('Invalid internship ID format');
        }
        const company = await this.companyModel.findOne({
            user: new mongoose_2.Types.ObjectId(req.user.userId)
        });
        if (!company) {
            throw new common_1.NotFoundException('Company profile not found');
        }
        const result = await this.internshipService.getInternshipWithApplications(internshipId);
        if (!result) {
            throw new common_1.NotFoundException('Internship not found');
        }
        const internshipCompanyId = result.internship.company._id
            ? result.internship.company._id.toString()
            : result.internship.company.toString();
        const userCompanyId = company._id.toString();
        if (internshipCompanyId !== userCompanyId) {
            throw new common_1.NotFoundException('This internship does not belong to your company');
        }
        let applications = result.applications;
        if (filterBy && filterValue) {
            applications = applications.filter((app) => {
                if (filterBy === 'name') {
                    return app.student.username.toLowerCase().includes(filterValue.toLowerCase());
                }
                else if (filterBy === 'status') {
                    return app.status === filterValue;
                }
                return true;
            });
        }
        if (sortBy === 'name') {
            applications.sort((a, b) => a.student.username.localeCompare(b.student.username));
        }
        else if (sortBy === 'date') {
            applications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return {
            internship: result.internship,
            applications
        };
    }
};
exports.CompanyInternshipController = CompanyInternshipController;
__decorate([
    (0, common_1.Get)('my-internships'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CompanyInternshipController.prototype, "getMyInternships", null);
__decorate([
    (0, common_1.Get)('internship/:id/applications'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('sortBy')),
    __param(3, (0, common_1.Query)('filterBy')),
    __param(4, (0, common_1.Query)('filterValue')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CompanyInternshipController.prototype, "getInternshipApplications", null);
exports.CompanyInternshipController = CompanyInternshipController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.COMPANY),
    (0, common_1.Controller)('company'),
    __param(1, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __metadata("design:paramtypes", [internship_service_1.InternshipService,
        mongoose_2.Model])
], CompanyInternshipController);
//# sourceMappingURL=company-internship.controller.js.map