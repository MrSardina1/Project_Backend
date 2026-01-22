"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const auth_module_1 = require("../Auth/auth.module");
const user_schema_1 = require("../user/user.schema");
const company_schema_1 = require("../company/company.schema");
const internship_schema_1 = require("../Internship/internship.schema");
const application_schema_1 = require("../Application/application.schema");
const review_schema_1 = require("../Review/review.schema");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: company_schema_1.Company.name, schema: company_schema_1.CompanySchema },
                { name: internship_schema_1.Internship.name, schema: internship_schema_1.InternshipSchema },
                { name: application_schema_1.Application.name, schema: application_schema_1.ApplicationSchema },
                { name: review_schema_1.Review.name, schema: review_schema_1.ReviewSchema },
            ]),
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map