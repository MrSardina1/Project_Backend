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
exports.AIChatController = void 0;
const common_1 = require("@nestjs/common");
const aichat_service_1 = require("./aichat.service");
const jwt_auth_guard_1 = require("../Auth/jwt.auth.guard");
const aichatSchema = __importStar(require("./aichat.schema"));
const platform_express_1 = require("@nestjs/platform-express");
let AIChatController = class AIChatController {
    aiChatService;
    constructor(aiChatService) {
        this.aiChatService = aiChatService;
    }
    async ask(req, prompt) {
        const userId = req.user.userId;
        return { response: await this.aiChatService.ask(userId, prompt) };
    }
    async saveCV(req, cvData) {
        const userId = req.user.userId;
        return this.aiChatService.saveCV(userId, cvData);
    }
    async getCV(req) {
        const userId = req.user.userId;
        return this.aiChatService.getCV(userId);
    }
    async deleteCV(req) {
        const userId = req.user.userId;
        return this.aiChatService.deleteCV(userId);
    }
    async analyzeCV(req) {
        const userId = req.user.userId;
        return { response: await this.aiChatService.analyzeCV(userId) };
    }
    async uploadCV(req, file) {
        console.log('--- PDF Upload Started ---');
        if (!file) {
            console.error('Upload Error: No file provided by Multer');
            throw new common_1.BadRequestException('No file uploaded');
        }
        console.log(`Received file: ${file.originalname}, Size: ${file.size} bytes`);
        try {
            const userId = req.user.userId;
            console.log(`User ID: ${userId}`);
            console.log('Extracting text from PDF...');
            const text = await this.aiChatService.extractTextFromPDF(file.buffer);
            console.log(`Extracted text length: ${text.length} chars`);
            if (!text || text.trim().length === 0) {
                console.warn('Warning: Extracted text is empty');
            }
            console.log('Sending text for AI analysis...');
            const analysis = await this.aiChatService.analyzeCV(userId, text);
            console.log('AI Analysis complete');
            return { response: analysis };
        }
        catch (error) {
            console.error('PDF Upload/Analysis Error:', error);
            throw new common_1.BadRequestException(`Processing failed: ${error.message}`);
        }
        finally {
            console.log('--- PDF Upload Finished ---');
        }
    }
};
exports.AIChatController = AIChatController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('ask'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('prompt')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AIChatController.prototype, "ask", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('cv'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AIChatController.prototype, "saveCV", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('cv'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AIChatController.prototype, "getCV", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('cv'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AIChatController.prototype, "deleteCV", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('cv/analyze'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AIChatController.prototype, "analyzeCV", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('upload-cv'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AIChatController.prototype, "uploadCV", null);
exports.AIChatController = AIChatController = __decorate([
    (0, common_1.Controller)('aichat'),
    __metadata("design:paramtypes", [aichat_service_1.AIChatService])
], AIChatController);
//# sourceMappingURL=aichat.controller.js.map