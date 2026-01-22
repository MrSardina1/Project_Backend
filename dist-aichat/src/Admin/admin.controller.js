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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../Auth/jwt.auth.guard");
const roles_guard_1 = require("../Auth/roles.guard");
const roles_decorator_1 = require("../Auth/roles.decorator");
const roles_enum_1 = require("../Auth/roles.enum");
const admin_service_1 = require("./admin.service");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    getStats() {
        return this.adminService.getDashboardStats();
    }
    getAllUsers(sortBy, filterBy, filterValue, status) {
        return this.adminService.getAllUsers(sortBy, filterBy, filterValue, status);
    }
    getUserById(id) {
        return this.adminService.getUserById(id);
    }
    updateUser(id, data) {
        return this.adminService.updateUser(id, data);
    }
    createUser(data) {
        return this.adminService.createUser(data);
    }
    updateRole(id, role) {
        return this.adminService.updateRole(id, role);
    }
    deleteUser(id) {
        return this.adminService.deleteUser(id);
    }
    softDeleteUser(id) {
        return this.adminService.softDeleteUser(id);
    }
    restoreUser(id) {
        return this.adminService.restoreUser(id);
    }
    getAllCompanies(sortBy, filterBy, filterValue, status) {
        return this.adminService.getAllCompanies(sortBy, filterBy, filterValue, status);
    }
    getPendingCompanies() {
        return this.adminService.getPendingCompanies();
    }
    getActiveCompanies() {
        return this.adminService.getActiveCompanies();
    }
    getCompaniesWithStats() {
        return this.adminService.getCompaniesWithInternshipCounts();
    }
    verifyCompany(id, status) {
        return this.adminService.verifyCompany(id, status);
    }
    updateCompany(id, data) {
        return this.adminService.updateCompany(id, data);
    }
    deleteCompany(id) {
        return this.adminService.deleteCompany(id);
    }
    restoreCompany(id) {
        return this.adminService.restoreCompany(id);
    }
    getAllInternships(sortBy, filterBy, filterValue, company) {
        return this.adminService.getAllInternships(sortBy, filterBy, filterValue, company);
    }
    deleteInternship(id) {
        return this.adminService.deleteInternship(id);
    }
    getAllApplications() {
        return this.adminService.getAllApplications();
    }
    getAllReviews(company, reviewer) {
        return this.adminService.getAllReviews(company, reviewer);
    }
    getCompaniesWithReviewCounts() {
        return this.adminService.getCompaniesWithReviewCounts();
    }
    deleteReview(id) {
        return this.adminService.deleteReview(id);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)('sortBy')),
    __param(1, (0, common_1.Query)('filterBy')),
    __param(2, (0, common_1.Query)('filterValue')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Patch)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Post)('users'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/role'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Delete)('users/:id/soft'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "softDeleteUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/restore'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "restoreUser", null);
__decorate([
    (0, common_1.Get)('companies'),
    __param(0, (0, common_1.Query)('sortBy')),
    __param(1, (0, common_1.Query)('filterBy')),
    __param(2, (0, common_1.Query)('filterValue')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAllCompanies", null);
__decorate([
    (0, common_1.Get)('companies/pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getPendingCompanies", null);
__decorate([
    (0, common_1.Get)('companies/active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getActiveCompanies", null);
__decorate([
    (0, common_1.Get)('companies/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getCompaniesWithStats", null);
__decorate([
    (0, common_1.Patch)('companies/:id/verify'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "verifyCompany", null);
__decorate([
    (0, common_1.Patch)('companies/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateCompany", null);
__decorate([
    (0, common_1.Delete)('companies/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteCompany", null);
__decorate([
    (0, common_1.Patch)('companies/:id/restore'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "restoreCompany", null);
__decorate([
    (0, common_1.Get)('internships'),
    __param(0, (0, common_1.Query)('sortBy')),
    __param(1, (0, common_1.Query)('filterBy')),
    __param(2, (0, common_1.Query)('filterValue')),
    __param(3, (0, common_1.Query)('company')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAllInternships", null);
__decorate([
    (0, common_1.Delete)('internships/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteInternship", null);
__decorate([
    (0, common_1.Get)('applications'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAllApplications", null);
__decorate([
    (0, common_1.Get)('reviews'),
    __param(0, (0, common_1.Query)('company')),
    __param(1, (0, common_1.Query)('reviewer')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAllReviews", null);
__decorate([
    (0, common_1.Get)('reviews/companies'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getCompaniesWithReviewCounts", null);
__decorate([
    (0, common_1.Delete)('reviews/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteReview", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map