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
exports.ApplicationController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../Auth/jwt.auth.guard");
const roles_guard_1 = require("../Auth/roles.guard");
const roles_decorator_1 = require("../Auth/roles.decorator");
const roles_enum_1 = require("../Auth/roles.enum");
const application_service_1 = require("./application.service");
const create_application_dto_1 = require("./dto/create-application.dto");
const update_application_status_dto_1 = require("./dto/update-application-status.dto");
let ApplicationController = class ApplicationController {
    applicationService;
    constructor(applicationService) {
        this.applicationService = applicationService;
    }
    apply(req, dto) {
        return this.applicationService.apply(req.user.userId, dto.internshipId);
    }
    findAll(req) {
        const userId = req.user.userId;
        const userRole = req.user.role;
        return this.applicationService.findAll(userId, userRole);
    }
    getMyApplications(req) {
        return this.applicationService.getMyApplications(req.user.userId);
    }
    getAcceptedCompanies(req) {
        return this.applicationService.getAcceptedCompanies(req.user.userId);
    }
    getApplicationCount(internshipId) {
        return this.applicationService.getApplicationCount(internshipId);
    }
    updateStatus(req, id, dto) {
        const userId = req.user.userId;
        const userRole = req.user.role;
        return this.applicationService.updateStatus(id, dto.status, userId, userRole);
    }
};
exports.ApplicationController = ApplicationController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.STUDENT),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_application_dto_1.CreateApplicationDto]),
    __metadata("design:returntype", void 0)
], ApplicationController.prototype, "apply", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN, roles_enum_1.Role.COMPANY, roles_enum_1.Role.STUDENT),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApplicationController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my-applications'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.STUDENT),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApplicationController.prototype, "getMyApplications", null);
__decorate([
    (0, common_1.Get)('accepted-companies'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.STUDENT),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApplicationController.prototype, "getAcceptedCompanies", null);
__decorate([
    (0, common_1.Get)('count/:internshipId'),
    __param(0, (0, common_1.Param)('internshipId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ApplicationController.prototype, "getApplicationCount", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN, roles_enum_1.Role.COMPANY),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_application_status_dto_1.UpdateApplicationStatusDto]),
    __metadata("design:returntype", void 0)
], ApplicationController.prototype, "updateStatus", null);
exports.ApplicationController = ApplicationController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('applications'),
    __metadata("design:paramtypes", [application_service_1.ApplicationService])
], ApplicationController);
//# sourceMappingURL=application.controller.js.map