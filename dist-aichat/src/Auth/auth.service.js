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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const user_schema_1 = require("../user/user.schema");
const email_service_1 = require("../email/email.service");
const company_schema_1 = require("../company/company.schema");
const roles_enum_1 = require("./roles.enum");
let AuthService = class AuthService {
    userModel;
    companyModel;
    jwtService;
    emailService;
    constructor(userModel, companyModel, jwtService, emailService) {
        this.userModel = userModel;
        this.companyModel = companyModel;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }
    async register(registerDto) {
        try {
            const { username, email, password, role } = registerDto;
            console.log('Register called with:', { username, email, role });
            if (!username || !email || !password) {
                throw new common_1.BadRequestException('Username, email, and password are required');
            }
            const existingUser = await this.userModel.findOne({ email });
            if (existingUser) {
                throw new common_1.ConflictException('Email already registered');
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const user = new this.userModel({
                name: username,
                username: username,
                email,
                password: hashedPassword,
                emailVerificationToken: verificationToken,
                emailVerificationExpires: verificationExpires,
                isEmailVerified: false,
                role: role || roles_enum_1.Role.STUDENT,
            });
            console.log('Saving user:', { username, email, role });
            await user.save();
            console.log('User saved successfully');
            try {
                console.log('Sending verification email...');
                await this.emailService.sendVerificationEmail(email, verificationToken);
                console.log('Verification email sent successfully');
            }
            catch (emailError) {
                console.error('Failed to send verification email, but user was created:', emailError);
                return {
                    message: 'Registration successful! However, we could not send the verification email. Please contact support.',
                };
            }
            return {
                message: 'Registration successful! Please check your email to verify your account.',
            };
        }
        catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }
    async registerCompany(registerDto) {
        try {
            const { name, username, email, password, website, description } = registerDto;
            console.log('Company register called with:', { name, username, email });
            if (!name || !username || !email || !password) {
                throw new common_1.BadRequestException('Company name, username, email, and password are required');
            }
            const existingUser = await this.userModel.findOne({ email });
            if (existingUser) {
                throw new common_1.ConflictException('Email already registered');
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const user = new this.userModel({
                name: name,
                username: username,
                email,
                password: hashedPassword,
                emailVerificationToken: verificationToken,
                emailVerificationExpires: verificationExpires,
                isEmailVerified: false,
                role: roles_enum_1.Role.COMPANY,
            });
            console.log('Saving company user:', { name, username, email });
            await user.save();
            console.log('Company user saved successfully');
            const company = new this.companyModel({
                name: name,
                description: description,
                email: email,
                website: website,
                user: user._id,
                status: company_schema_1.CompanyStatus.PENDING,
            });
            await company.save();
            console.log('Company profile created successfully');
            try {
                console.log('Sending verification email...');
                await this.emailService.sendVerificationEmail(email, verificationToken);
                console.log('Verification email sent successfully');
            }
            catch (emailError) {
                console.error('Failed to send verification email, but user was created:', emailError);
                return {
                    message: 'Company registration successful! However, we could not send the verification email. Please contact support.',
                };
            }
            return {
                message: 'Company registration successful! Please check your email to verify your account and wait for admin approval.',
            };
        }
        catch (error) {
            console.error('Company registration error:', error);
            throw error;
        }
    }
    async verifyEmail(token) {
        const user = await this.userModel.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired verification token');
        }
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
        const payload = {
            sub: user._id,
            email: user.email,
            role: user.role,
            username: user.username,
            profilePicture: user.profilePicture,
            bio: user.bio
        };
        const access_token = this.jwtService.sign(payload);
        return {
            message: 'Email verified successfully! You are now logged in.',
            access_token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                bio: user.bio,
            },
        };
    }
    async resendVerification(email) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.isEmailVerified) {
            throw new common_1.BadRequestException('Email already verified');
        }
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = verificationExpires;
        await user.save();
        await this.emailService.sendVerificationEmail(email, verificationToken);
        return { message: 'Verification email sent successfully!' };
    }
    async login(email, password) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isEmailVerified) {
            throw new common_1.UnauthorizedException('Please verify your email before logging in');
        }
        if (user.isActive === false) {
            throw new common_1.UnauthorizedException('Your account has been deactivated. Please contact support.');
        }
        if (user.role === roles_enum_1.Role.COMPANY) {
            const company = await this.companyModel.findOne({ user: user._id });
            if (!company) {
                throw new common_1.UnauthorizedException('Company profile not found. Please contact support.');
            }
            if (company.status === company_schema_1.CompanyStatus.PENDING) {
                throw new common_1.UnauthorizedException('Your company account is pending admin approval.');
            }
            if (company.status === company_schema_1.CompanyStatus.REJECTED) {
                throw new common_1.UnauthorizedException('Your company account application was rejected.');
            }
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        let profileName = user.name;
        let profilePicture = user.profilePicture;
        let bio = user.bio;
        if (user.role === roles_enum_1.Role.COMPANY) {
            const company = await this.companyModel.findOne({ user: user._id });
            if (company) {
                profileName = company.name;
                profilePicture = company.profilePicture;
                bio = company.description;
            }
        }
        const payload = {
            sub: user._id,
            email: user.email,
            role: user.role,
            username: user.username,
            name: profileName,
            profilePicture: profilePicture,
            bio: bio
        };
        const access_token = this.jwtService.sign(payload);
        return {
            access_token,
            user: {
                id: user._id,
                name: profileName,
                username: user.username,
                email: user.email,
                role: user.role,
                profilePicture: profilePicture,
                bio: bio,
            },
        };
    }
    async forgotPassword(email) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            return {
                message: 'If the email exists, a password reset link has been sent.',
            };
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000);
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = resetExpires;
        await user.save();
        await this.emailService.sendPasswordResetEmail(email, resetToken);
        return {
            message: 'If the email exists, a password reset link has been sent.',
        };
    }
    async resetPassword(token, newPassword) {
        const user = await this.userModel.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        return { message: 'Password reset successfully! You can now login.' };
    }
    async testEmailConnection(email) {
        try {
            console.log('Testing email connection...');
            await this.emailService.sendVerificationEmail(email, 'test-token-123');
            return {
                message: 'Test email sent successfully! Check your inbox.',
                details: 'If you don\'t receive it, check SMTP configuration'
            };
        }
        catch (error) {
            console.error('Email test failed:', error);
            return {
                message: 'Email test failed',
                details: error.message
            };
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        jwt_1.JwtService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map