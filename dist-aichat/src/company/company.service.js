"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const company_schema_1 = require("./company.schema");
const user_schema_1 = require("../user/user.schema");
const bcrypt = __importStar(require("bcrypt"));
const roles_enum_1 = require("../Auth/roles.enum");
let CompanyService = class CompanyService {
    companyModel;
    userModel;
    constructor(companyModel, userModel) {
        this.companyModel = companyModel;
        this.userModel = userModel;
    }
    async create(data) {
        const existingUser = await this.userModel.findOne({ email: data.email });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const existingCompany = await this.companyModel.findOne({ email: data.email });
        if (existingCompany) {
            throw new common_1.ConflictException('Company with this email already exists');
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        const user = await this.userModel.create({
            username: data.username,
            email: data.email,
            password: hashedPassword,
            role: roles_enum_1.Role.COMPANY,
        });
        const company = await this.companyModel.create({
            name: data.name,
            description: data.description,
            email: data.email,
            website: data.website,
            user: user._id,
            status: company_schema_1.CompanyStatus.PENDING,
        });
        return {
            message: 'Company registration submitted successfully. Please wait for admin verification.',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            company: {
                id: company._id,
                name: company.name,
                email: company.email,
                status: company.status,
            },
        };
    }
    async linkUserToCompany(userId, companyData) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const existingCompany = await this.companyModel.findOne({ user: userId });
        if (existingCompany) {
            throw new common_1.ConflictException('This user is already linked to a company');
        }
        const emailExists = await this.companyModel.findOne({ email: companyData.email });
        if (emailExists) {
            throw new common_1.ConflictException('Company with this email already exists');
        }
        const company = await this.companyModel.create({
            name: companyData.name,
            description: companyData.description,
            email: companyData.email,
            website: companyData.website,
            user: userId,
            status: company_schema_1.CompanyStatus.PENDING,
        });
        return {
            message: 'Company linked to user successfully',
            company: {
                id: company._id,
                name: company.name,
                email: company.email,
                status: company.status,
            },
        };
    }
    findAll() {
        return this.companyModel
            .find({ status: company_schema_1.CompanyStatus.APPROVED })
            .populate('user', 'username email profilePicture');
    }
    async getCompanyByUserId(userId) {
        const company = await this.companyModel
            .findOne({ user: userId })
            .populate('user', 'username email profilePicture');
        if (!company) {
            throw new common_1.NotFoundException('Company profile not found');
        }
        return company;
    }
    async getCompanyStatus(userId) {
        const company = await this.companyModel.findOne({ user: userId });
        if (!company) {
            throw new common_1.NotFoundException('Company profile not found');
        }
        return { status: company.status };
    }
};
exports.CompanyService = CompanyService;
exports.CompanyService = CompanyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], CompanyService);
//# sourceMappingURL=company.service.js.map