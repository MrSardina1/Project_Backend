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
exports.InternshipController = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const jwt_auth_guard_1 = require("../Auth/jwt.auth.guard");
const roles_guard_1 = require("../Auth/roles.guard");
const internship_service_1 = require("./internship.service");
const roles_enum_1 = require("../Auth/roles.enum");
const roles_decorator_1 = require("../Auth/roles.decorator");
const public_decorator_1 = require("../Auth/public.decorator");
const create_internship_dto_1 = require("./dto/create-internship.dto");
const company_schema_1 = require("../company/company.schema");
let InternshipController = class InternshipController {
    internshipService;
    companyModel;
    constructor(internshipService, companyModel) {
        this.internshipService = internshipService;
        this.companyModel = companyModel;
    }
    async create(body, req) {
        const userId = req.user.userId;
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const company = await this.companyModel.findOne({ user: userObjectId });
        if (!company) {
            throw new common_1.NotFoundException('Company profile not found for this user');
        }
        console.log('=== CREATING INTERNSHIP ===');
        console.log('User ID:', userId);
        console.log('Company ID:', company._id.toString());
        console.log('Company Name:', company.name);
        console.log('========================');
        return this.internshipService.create(body, company._id.toString());
    }
    findAll(req) {
        const userId = req.user?.userId;
        return this.internshipService.findAll(userId);
    }
};
exports.InternshipController = InternshipController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.COMPANY),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_internship_dto_1.CreateInternshipDto, Object]),
    __metadata("design:returntype", Promise)
], InternshipController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InternshipController.prototype, "findAll", null);
exports.InternshipController = InternshipController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('internships'),
    __param(1, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __metadata("design:paramtypes", [internship_service_1.InternshipService,
        mongoose_2.Model])
], InternshipController);
//# sourceMappingURL=internship.controller.js.map