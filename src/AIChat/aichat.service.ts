import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AIChat, AIChatDocument, CVData } from './aichat.schema';
import { Internship, InternshipDocument } from 'src/Internship/internship.schema';

@Injectable()
export class AIChatService {
  private readonly OPENROUTER_API_KEY = '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';
  private readonly OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

  constructor(
    @InjectModel(AIChat.name) private chatModel: Model<AIChatDocument>,
    @InjectModel(Internship.name) private internshipModel: Model<InternshipDocument>
  ) {}

  async saveCV(userId: string, cvData: CVData): Promise<{ message: string }> {
    // Save or update CV
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

  async getCV(userId: string): Promise<CVData | null> {
    const cvEntry = await this.chatModel
      .findOne({ user: userId, isCVAnalysis: true })
      .sort({ createdAt: -1 });

    return cvEntry?.cvData || null;
  }

  async analyzeCV(userId: string): Promise<string> {
    const cv = await this.getCV(userId);
    
    if (!cv) {
      return 'No CV found. Please upload your CV first to get personalized internship recommendations.';
    }

    // Get all available internships
    const internships = await this.internshipModel
      .find()
      .populate('company', 'name website')
      .lean();

    // Create AI analysis prompt
    const cvSummary = `
Profile Summary:
- Name: ${cv.fullName}
- Skills: ${cv.skills.join(', ')}
- Experience: ${cv.experience.map(e => `${e.title} at ${e.company}`).join(', ')}
- Education: ${cv.education.map(e => `${e.degree} from ${e.institution}`).join(', ')}
- Career Goals: ${cv.careerGoals || 'Not specified'}
- Preferred Industries: ${cv.preferredIndustries?.join(', ') || 'Not specified'}
`;

    const internshipsInfo = internships.map((int: any) => 
      `- ${int.title} at ${int.company?.name || 'Unknown'} (${int.location}) - ${int.description?.substring(0, 100) || 'No description'}`
    ).join('\n');

    const prompt = `
You are a career advisor AI. Analyze this candidate's profile and recommend the best matching internships.

${cvSummary}

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
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || 'Unable to analyze CV';

      // Save analysis
      await this.chatModel.create({
        user: userId,
        prompt: 'CV_ANALYSIS',
        response: answer,
        provider: 'openrouter-llama-3.3',
        isCVAnalysis: true,
      });

      return answer;
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return this.getFallbackAnalysis(cv, internships);
    }
  }

  async ask(userId: string, prompt: string): Promise<string> {
    // Check if asking about CV or internship recommendations
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
    } catch (error) {
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

  private getFallbackAnalysis(cv: CVData, internships: any[]): string {
    const skills = cv.skills.join(', ').toLowerCase();
    const matches = internships.filter((int: any) => {
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

${top3.map((int: any, i: number) => `
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

  private getFallbackResponse(prompt: string): string {
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
}