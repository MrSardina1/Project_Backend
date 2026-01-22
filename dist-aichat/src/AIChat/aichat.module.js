"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIChatModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const aichat_schema_1 = require("./aichat.schema");
const aichat_service_1 = require("./aichat.service");
const aichat_controller_1 = require("./aichat.controller");
const auth_core_module_1 = require("../Auth/auth-core.module");
const internship_schema_1 = require("../Internship/internship.schema");
let AIChatModule = class AIChatModule {
};
exports.AIChatModule = AIChatModule;
exports.AIChatModule = AIChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_core_module_1.AuthCoreModule,
            mongoose_1.MongooseModule.forFeature([
                { name: aichat_schema_1.AIChat.name, schema: aichat_schema_1.AIChatSchema },
                { name: internship_schema_1.Internship.name, schema: internship_schema_1.InternshipSchema }
            ]),
        ],
        providers: [aichat_service_1.AIChatService],
        controllers: [aichat_controller_1.AIChatController],
    })
], AIChatModule);
//# sourceMappingURL=aichat.module.js.map