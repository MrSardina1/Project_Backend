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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let EmailService = EmailService_1 = class EmailService {
    configService;
    transporter;
    logger = new common_1.Logger(EmailService_1.name);
    constructor(configService) {
        this.configService = configService;
        const smtpHost = this.configService.get('SMTP_HOST');
        const smtpPort = this.configService.get('SMTP_PORT');
        const emailUser = this.configService.get('EMAIL_USER');
        const emailPass = this.configService.get('EMAIL_PASS');
        this.logger.log(`Initializing email service with SMTP: ${smtpHost}:${smtpPort}`);
        this.logger.log(`Email user: ${emailUser}`);
        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: emailUser,
                pass: emailPass,
            },
            tls: {
                rejectUnauthorized: false,
            },
            debug: true,
            logger: true,
        });
        this.transporter.verify((error, success) => {
            if (error) {
                this.logger.error('SMTP connection failed:', error);
            }
            else {
                this.logger.log('SMTP server is ready to send emails');
            }
        });
    }
    async sendVerificationEmail(email, verificationToken) {
        try {
            const verificationLink = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${verificationToken}`;
            this.logger.log(`Attempting to send verification email to: ${email}`);
            this.logger.log(`Verification link: ${verificationLink}`);
            const mailOptions = {
                from: this.configService.get('EMAIL_FROM'),
                to: email,
                subject: 'Verify Your Email Address - InterPortal',
                html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap');
            body {
              font-family: 'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #1e293b;
              margin: 0;
              padding: 0;
              background-color: #f8fafc;
            }
            .wrapper {
              width: 100%;
              background-color: #f8fafc;
              padding: 40px 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            }
            .header {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              padding: 40px 20px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
              letter-spacing: -0.025em;
            }
            .content {
              padding: 40px;
              text-align: center;
            }
            .content h2 {
              color: #0f172a;
              font-size: 24px;
              margin-bottom: 16px;
              font-weight: 600;
            }
            .content p {
              color: #64748b;
              font-size: 16px;
              margin-bottom: 32px;
            }
            .button {
              display: inline-block;
              padding: 16px 36px;
              background: #4f46e5;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              transition: all 0.3s ease;
              box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
            }
            .link-box {
              background: #f1f5f9;
              padding: 16px;
              border-radius: 8px;
              margin-top: 32px;
              word-break: break-all;
              font-size: 13px;
              color: #94a3b8;
            }
            .footer {
              padding: 30px;
              text-align: center;
              font-size: 13px;
              color: #94a3b8;
              border-top: 1px solid #f1f5f9;
            }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 16px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <div class="badge">Registration</div>
                <h1>Welcome to InterPortal</h1>
              </div>
              <div class="content">
                <h2>Verify Your Email</h2>
                <p>We're excited to have you on board! Please click the button below to verify your email address and complete your registration.</p>
                <a href="${verificationLink}" class="button">Verify My Account</a>
                
                <div class="link-box">
                  Trouble clicking? Copy and paste this link:<br>
                  <span style="color: #4f46e5;">${verificationLink}</span>
                </div>
                <p style="margin-top: 24px; font-size: 14px; color: #94a3b8;">
                  This link will expire in 24 hours.<br>
                  If you didn't create an account, you can safely ignore this email.
                </p>
              </div>
              <div class="footer">
                &copy; 2026 InterPortal - Professional Internship Gateway.<br>
                All rights reserved.
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
            };
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email sent successfully to ${email}`);
            this.logger.log(`Message ID: ${info.messageId}`);
            this.logger.log(`Response: ${info.response}`);
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${email}:`, error);
            throw error;
        }
    }
    async sendPasswordResetEmail(email, resetToken) {
        try {
            const resetLink = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
            this.logger.log(`Attempting to send password reset email to: ${email}`);
            const mailOptions = {
                from: this.configService.get('EMAIL_FROM'),
                to: email,
                subject: 'Password Reset Request - InterPortal',
                html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap');
            body {
              font-family: 'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #1e293b;
              margin: 0;
              padding: 0;
              background-color: #f8fafc;
            }
            .wrapper {
              width: 100%;
              background-color: #f8fafc;
              padding: 40px 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            }
            .header {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              padding: 40px 20px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
              letter-spacing: -0.025em;
            }
            .content {
              padding: 40px;
              text-align: center;
            }
            .content h2 {
              color: #0f172a;
              font-size: 24px;
              margin-bottom: 16px;
              font-weight: 600;
            }
            .content p {
              color: #64748b;
              font-size: 16px;
              margin-bottom: 32px;
            }
            .button {
              display: inline-block;
              padding: 16px 36px;
              background: #f59e0b;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              transition: all 0.3s ease;
              box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
            }
            .link-box {
              background: #f1f5f9;
              padding: 16px;
              border-radius: 8px;
              margin-top: 32px;
              word-break: break-all;
              font-size: 13px;
              color: #94a3b8;
            }
            .footer {
              padding: 30px;
              text-align: center;
              font-size: 13px;
              color: #94a3b8;
              border-top: 1px solid #f1f5f9;
            }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 16px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <div class="badge">Security</div>
                <h1>Security Alert</h1>
              </div>
              <div class="content">
                <h2>Reset Your Password</h2>
                <p>We received a request to reset your password. If you initiated this request, please click the button below to set a new password.</p>
                <a href="${resetLink}" class="button">Reset Password</a>
                
                <div class="link-box">
                  Trouble clicking? Copy and paste this link:<br>
                  <span style="color: #f59e0b;">${resetLink}</span>
                </div>
                <p style="margin-top: 24px; font-size: 14px; color: #94a3b8;">
                  This link will expire in 1 hour.<br>
                  If you didn't request a password reset, you can safely ignore this email.
                </p>
              </div>
              <div class="footer">
                &copy; 2026 InterPortal - Professional Internship Gateway.<br>
                All rights reserved.
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
            };
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Password reset email sent successfully to ${email}`);
            this.logger.log(`Message ID: ${info.messageId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send password reset email to ${email}:`, error);
            throw error;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map