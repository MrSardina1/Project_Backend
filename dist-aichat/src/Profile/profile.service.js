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
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../user/user.schema");
const company_schema_1 = require("../company/company.schema");
const bcrypt = __importStar(require("bcrypt"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let ProfileService = class ProfileService {
    userModel;
    companyModel;
    constructor(userModel, companyModel) {
        this.userModel = userModel;
        this.companyModel = companyModel;
    }
    async getProfile(userId, userRole) {
        if (userRole === 'COMPANY') {
            const company = await this.companyModel
                .findOne({ user: new mongoose_2.Types.ObjectId(userId) })
                .populate('user', '-password');
            if (!company) {
                throw new common_1.NotFoundException('Company profile not found');
            }
            return company;
        }
        const user = await this.userModel.findById(userId).select('-password');
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async getUserProfile(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.NotFoundException('Invalid user ID');
        }
        const user = await this.userModel.findById(userId).select('-password');
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async getCompanyProfile(companyId) {
        if (!mongoose_2.Types.ObjectId.isValid(companyId)) {
            throw new common_1.NotFoundException('Invalid company ID');
        }
        const company = await this.companyModel
            .findById(companyId)
            .populate('user', 'username email profilePicture');
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        return company;
    }
    async updateProfile(userId, userRole, data) {
        if (userRole === 'COMPANY') {
            const company = await this.companyModel
                .findOneAndUpdate({ user: new mongoose_2.Types.ObjectId(userId) }, { $set: data }, { new: true })
                .populate('user', '-password');
            if (!company) {
                throw new common_1.NotFoundException('Company profile not found');
            }
            return company;
        }
        const user = await this.userModel.findByIdAndUpdate(userId, { $set: data }, { new: true }).select('-password');
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async updateProfilePicture(userId, userRole, filename) {
        const picturePath = `uploads/profiles/${filename}`;
        if (userRole === 'COMPANY') {
            const company = await this.companyModel
                .findOneAndUpdate({ user: new mongoose_2.Types.ObjectId(userId) }, { profilePicture: picturePath }, { new: true });
            if (!company) {
                throw new common_1.NotFoundException('Company profile not found');
            }
            await this.userModel.findByIdAndUpdate(userId, { profilePicture: picturePath });
            return { profilePicture: picturePath };
        }
        const user = await this.userModel.findByIdAndUpdate(userId, { profilePicture: picturePath }, { new: true }).select('-password');
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return { profilePicture: picturePath };
    }
    async removeProfilePicture(userId, userRole) {
        if (userRole === 'COMPANY') {
            const company = await this.companyModel.findOne({
                user: new mongoose_2.Types.ObjectId(userId)
            });
            if (!company) {
                throw new common_1.NotFoundException('Company profile not found');
            }
            if (company.profilePicture) {
                const filePath = path.join(process.cwd(), company.profilePicture);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            await this.companyModel.findByIdAndUpdate(company._id, { $unset: { profilePicture: "" } });
            return { message: 'Profile picture removed successfully' };
        }
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.profilePicture) {
            const filePath = path.join(process.cwd(), user.profilePicture);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        await this.userModel.findByIdAndUpdate(userId, { $unset: { profilePicture: "" } });
        return { message: 'Profile picture removed successfully' };
    }
    async changePassword(userId, oldPassword, newPassword) {
        let user;
        let isCompany = false;
        user = await this.userModel.findById(userId);
        if (!user) {
            const company = await this.companyModel
                .findOne({ user: new mongoose_2.Types.ObjectId(userId) })
                .populate('user');
            if (company && company.user) {
                user = company.user;
                isCompany = true;
            }
        }
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Old password is incorrect');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        if (isCompany) {
            await this.userModel.findByIdAndUpdate(user._id, {
                password: hashedPassword
            });
        }
        else {
            await this.userModel.findByIdAndUpdate(userId, {
                password: hashedPassword
            });
        }
        return { message: 'Password updated successfully' };
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], ProfileService);
//# sourceMappingURL=profile.service.js.map