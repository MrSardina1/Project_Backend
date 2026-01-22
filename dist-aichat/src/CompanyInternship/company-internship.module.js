"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyInternshipModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const company_internship_controller_1 = require("./company-internship.controller");
const internship_module_1 = require("../Internship/internship.module");
const application_module_1 = require("../Application/application.module");
const auth_module_1 = require("../Auth/auth.module");
const company_schema_1 = require("../company/company.schema");
let CompanyInternshipModule = class CompanyInternshipModule {
};
exports.CompanyInternshipModule = CompanyInternshipModule;
exports.CompanyInternshipModule = CompanyInternshipModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            internship_module_1.InternshipModule,
            application_module_1.ApplicationModule,
            mongoose_1.MongooseModule.forFeature([
                { name: company_schema_1.Company.name, schema: company_schema_1.CompanySchema },
            ]),
        ],
        controllers: [company_internship_controller_1.CompanyInternshipController],
    })
], CompanyInternshipModule);
//# sourceMappingURL=company-internship.module.js.map