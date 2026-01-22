"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternshipCoreModule = void 0;
const common_1 = require("@nestjs/common");
const internship_service_1 = require("./internship.service");
const auth_core_module_1 = require("../Auth/auth-core.module");
const mongoose_1 = require("@nestjs/mongoose");
const internship_schema_1 = require("./internship.schema");
const company_schema_1 = require("../company/company.schema");
const application_schema_1 = require("../Application/application.schema");
let InternshipCoreModule = class InternshipCoreModule {
};
exports.InternshipCoreModule = InternshipCoreModule;
exports.InternshipCoreModule = InternshipCoreModule = __decorate([
    (0, common_1.Module)({
        providers: [internship_service_1.InternshipService],
        controllers: [],
        imports: [
            auth_core_module_1.AuthCoreModule,
            mongoose_1.MongooseModule.forFeature([
                { name: internship_schema_1.Internship.name, schema: internship_schema_1.InternshipSchema },
                { name: company_schema_1.Company.name, schema: company_schema_1.CompanySchema },
                { name: application_schema_1.Application.name, schema: application_schema_1.ApplicationSchema },
            ]),
        ],
        exports: [internship_service_1.InternshipService]
    })
], InternshipCoreModule);
//# sourceMappingURL=internship-core.module.js.map