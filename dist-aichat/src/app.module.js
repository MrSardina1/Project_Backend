"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const database_module_1 = require("./Database/database.module");
const user_module_1 = require("./user/user.module");
const auth_module_1 = require("./Auth/auth.module");
const company_module_1 = require("./company/company.module");
const internship_module_1 = require("./Internship/internship.module");
const application_module_1 = require("./Application/application.module");
const review_module_1 = require("./Review/review.module");
const admin_module_1 = require("./Admin/admin.module");
const profile_module_1 = require("./Profile/profile.module");
const company_internship_module_1 = require("./CompanyInternship/company-internship.module");
const config_1 = require("@nestjs/config");
const email_module_1 = require("./email/email.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            database_module_1.DatabaseModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
            }),
            user_module_1.UserModule,
            auth_module_1.AuthModule,
            company_module_1.CompanyModule,
            internship_module_1.InternshipModule,
            application_module_1.ApplicationModule,
            review_module_1.ReviewModule,
            admin_module_1.AdminModule,
            profile_module_1.ProfileModule,
            company_internship_module_1.CompanyInternshipModule,
            email_module_1.EmailModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map