"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIChatService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const aichat_schema_1 = require("./aichat.schema");
const internship_schema_1 = require("../Internship/internship.schema");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
let AIChatService = class AIChatService {
    chatModel;
    internshipModel;
    OPENROUTER_API_KEY = (process.env.OPENAI_API_KEY || '').trim();
    OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
    MODEL = 'meta-llama/llama-3.3-70b-instruct:free';
    constructor(chatModel, internshipModel) {
        this.chatModel = chatModel;
        this.internshipModel = internshipModel;
    }
    async saveCV(userId, cvData) {
        await this.chatModel.create({
            user: userId,
            prompt: 'CV_SAVE',
            response: 'CV saved successfully',
            provider: 'system',
            cvData: cvData,
            isCVAnalysis: true,
        });
        return { message: 'CV saved successfully' };
    }
    async getCV(userId) {
        const cvEntry = await this.chatModel
            .findOne({
            user: userId,
            isCVAnalysis: true,
            $or: [
                { cvData: { $ne: null } },
                { prompt: 'CV_UPLOAD' }
            ]
        })
            .sort({ createdAt: -1 });
        return cvEntry || null;
    }
    async deleteCV(userId) {
        await this.chatModel.deleteMany({
            user: userId,
            isCVAnalysis: true
        });
        return { message: 'CV data deleted successfully' };
    }
    async analyzeCV(userId, rawText) {
        let cvInfo = '';
        if (rawText) {
            cvInfo = `Raw CV Text Content:\n${rawText}`;
            await this.chatModel.create({
                user: userId,
                prompt: 'CV_UPLOAD',
                response: 'CV text extracted successfully',
                rawText: rawText,
                provider: 'system',
                isCVAnalysis: true,
            });
        }
        else {
            const cvEntry = await this.getCV(userId);
            if (!cvEntry) {
                return 'No CV found. Please upload your CV first to get personalized internship recommendations.';
            }
            if (cvEntry.cvData) {
                const cv = cvEntry.cvData;
                cvInfo = `
Profile Summary:
- Name: ${cv.fullName}
- Skills: ${cv.skills?.join(', ') || 'Not specified'}
- Experience: ${cv.experience?.map((e) => `${e.title} at ${e.company}`).join(', ') || 'Not specified'}
- Education: ${cv.education?.map((e) => `${e.degree} from ${e.institution}`).join(', ') || 'Not specified'}
- Career Goals: ${cv.careerGoals || 'Not specified'}
- Preferred Industries: ${cv.preferredIndustries?.join(', ') || 'Not specified'}
`;
            }
            else if (cvEntry.prompt === 'CV_UPLOAD' && cvEntry.rawText) {
                cvInfo = `Raw CV Text Content:\n${cvEntry.rawText}`;
            }
            else {
                return 'Your CV data is incomplete. Please try re-uploading your PDF.';
            }
        }
        const internships = await this.internshipModel
            .find()
            .populate('company', 'name website')
            .lean();
        const internshipsInfo = internships.map((int) => `- ${int.title} at ${int.company?.name || 'Unknown'} (${int.location}) - ${int.description?.substring(0, 100) || 'No description'}`).join('\n');
        const prompt = `
You are a career advisor AI. Analyze this candidate's profile and recommend the best matching internships from our portal.

${cvInfo}

Available Internships:
${internshipsInfo}

Please provide:
1. Top 3-5 recommended internships with match percentage and reasoning
2. Skills the candidate should develop
3. Career advice based on their goals

Be specific and actionable.
`;
        try {
            const response = await fetch(this.OPENROUTER_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:4200',
                    'X-Title': 'Internship Portal AI CV Analyzer',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.MODEL,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert career advisor specializing in internship matching and career development.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('OpenRouter API Error:', response.status, errorData);
                throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
            }
            const data = await response.json();
            const answer = data.choices?.[0]?.message?.content || 'Unable to analyze CV';
            await this.chatModel.create({
                user: userId,
                prompt: 'CV_ANALYSIS',
                response: answer,
                provider: 'openrouter-llama-3.3',
                isCVAnalysis: true,
            });
            return answer;
        }
        catch (error) {
            console.error('AI Analysis Error:', error);
            throw new Error(`AI Analysis failed: ${error.message}`);
        }
    }
    async extractTextFromPDF(buffer) {
        try {
            const header = buffer.toString('utf8', 0, 5);
            if (!header.startsWith('%PDF-')) {
                console.error('Invalid PDF Header:', header);
                throw new Error('The file uploaded is not a valid PDF. Please make sure you are uploading a real .pdf file.');
            }
            console.log('PDF Header valid, parsing...');
            const data = await (0, pdf_parse_1.default)(buffer);
            if (!data || !data.text) {
                throw new Error('Could not extract any text from the PDF. It might be an image-only PDF or protected.');
            }
            return data.text;
        }
        catch (error) {
            console.error('PDF Extraction Error:', error);
            throw new Error(error.message || 'Failed to extract text from PDF');
        }
    }
    async ask(userId, prompt) {
        const lowerPrompt = prompt.toLowerCase();
        const isAboutCV = lowerPrompt.includes('cv') ||
            lowerPrompt.includes('resume') ||
            lowerPrompt.includes('recommend') ||
            lowerPrompt.includes('match') ||
            lowerPrompt.includes('internship for me');
        if (isAboutCV) {
            const cv = await this.getCV(userId);
            if (cv) {
                return this.analyzeCV(userId);
            }
        }
        try {
            const response = await fetch(this.OPENROUTER_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:4200',
                    'X-Title': 'Internship Portal AI Chat',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.MODEL,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful AI assistant for an internship portal. Help students and companies with questions about internships, career advice, applications, and general professional guidance. Be concise, professional, and supportive.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            const data = await response.json();
            const answer = data.choices?.[0]?.message?.content || 'No response from AI';
            await this.chatModel.create({
                user: userId,
                prompt,
                response: answer,
                provider: 'openrouter-llama-3.3',
            });
            return answer;
        }
        catch (error) {
            console.error('AI Error:', error);
            const fallback = this.getFallbackResponse(prompt);
            await this.chatModel.create({
                user: userId,
                prompt,
                response: fallback,
                provider: 'fallback',
                error: error.message,
            });
            return fallback;
        }
    }
    getFallbackAnalysis(cv, internships) {
        const skills = cv.skills.join(', ').toLowerCase();
        const matches = internships.filter((int) => {
            const desc = (int.title + ' ' + int.description).toLowerCase();
            return cv.skills.some(skill => desc.includes(skill.toLowerCase()));
        });
        const top3 = matches.slice(0, 3);
        return `
Based on your CV analysis:

**Your Profile:**
- ${cv.skills.length} key skills
- ${cv.experience.length} work experiences
- ${cv.education.length} education entries

**Top Recommended Internships:**

${top3.map((int, i) => `
${i + 1}. **${int.title}** at ${int.company?.name}
   - Location: ${int.location}
   - Duration: ${int.duration}
   - Match: Good fit for your ${cv.skills[0]} skills
`).join('\n')}

**Career Development Tips:**
1. Continue building projects in your field
2. Network with professionals in ${cv.preferredIndustries?.[0] || 'your industry'}
3. Consider adding certifications to strengthen your profile

${matches.length === 0 ? '\nNote: No exact matches found, but keep checking for new opportunities!' : ''}
`;
    }
    getFallbackResponse(prompt) {
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('internship') || lowerPrompt.includes('apply')) {
            return "Browse available internships in the Internships section. Click 'Apply' on positions that interest you. Make sure to complete your profile and upload your CV for personalized recommendations!";
        }
        if (lowerPrompt.includes('resume') || lowerPrompt.includes('cv')) {
            return "For a strong CV: 1) Clear formatting, 2) Relevant skills and experience, 3) Quantifiable achievements, 4) Tailored to each position, 5) Proofread carefully. You can upload your CV in the AI Assistant section for personalized internship matching!";
        }
        if (lowerPrompt.includes('interview')) {
            return "Interview tips: 1) Research the company, 2) Practice common questions, 3) Prepare your own questions, 4) Dress professionally, 5) Show enthusiasm. Follow up with a thank-you email!";
        }
        if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
            return "Hello! I'm your AI career assistant. I can help with internship advice, CV analysis, and career guidance. Upload your CV for personalized internship recommendations!";
        }
        return "I'm here to help with internship and career advice! Try asking about CV tips, interview preparation, or upload your CV for personalized internship recommendations.";
    }
};
exports.AIChatService = AIChatService;
exports.AIChatService = AIChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(aichat_schema_1.AIChat.name)),
    __param(1, (0, mongoose_1.InjectModel)(internship_schema_1.Internship.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], AIChatService);
//# sourceMappingURL=aichat.service.js.map