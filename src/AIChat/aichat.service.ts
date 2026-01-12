import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AIChat, AIChatDocument } from './aichat.schema';

@Injectable()
export class AIChatService {
  private readonly OPENROUTER_API_KEY = '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';
  private readonly OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

  constructor(@InjectModel(AIChat.name) private chatModel: Model<AIChatDocument>) {}

  async ask(userId: string, prompt: string): Promise<string> {
    try {
      // Call OpenRouter API with Llama 3.3
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      // Extract the response text
      const answer = data.choices?.[0]?.message?.content || 'No response from AI';

      // Save to database
      const chat = new this.chatModel({
        user: userId,
        prompt,
        response: answer,
        provider: 'openrouter-llama-3.3',
      });

      await chat.save();
      return answer;
      
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      
      // Fallback to simple response
      const fallbackResponse = this.getFallbackResponse(prompt);
      
      const chat = new this.chatModel({
        user: userId,
        prompt,
        response: fallbackResponse,
        provider: 'fallback',
        error: error.message,
      });
      
      await chat.save();
      return fallbackResponse;
    }
  }

  private getFallbackResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    // Internship-related responses
    if (lowerPrompt.includes('internship') || lowerPrompt.includes('apply')) {
      return "I can help you with internship applications! Browse available internships in the Internships section, and click 'Apply' on positions that interest you. Make sure to complete your profile first to make a good impression on companies.";
    }
    
    if (lowerPrompt.includes('resume') || lowerPrompt.includes('cv')) {
      return "For a strong resume, focus on: 1) Clear formatting, 2) Relevant skills and experience, 3) Quantifiable achievements, 4) Tailoring to each position, 5) Proofreading carefully. Keep it concise (1-2 pages) and highlight your most relevant qualifications.";
    }
    
    if (lowerPrompt.includes('interview')) {
      return "Interview tips: 1) Research the company thoroughly, 2) Practice common interview questions, 3) Prepare questions to ask, 4) Dress professionally, 5) Arrive early, 6) Show enthusiasm and confidence. Remember to follow up with a thank-you email!";
    }
    
    if (lowerPrompt.includes('company') || lowerPrompt.includes('review')) {
      return "You can view company reviews in the 'Reviews' section of each company profile. These reviews are written by students who have completed internships and can give you insights into the company culture and experience.";
    }
    
    // Greetings
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('hey')) {
      return "Hello! I'm your AI assistant for the Internship Portal. I can help you with questions about internships, applications, career advice, and navigating the platform. How can I assist you today?";
    }
    
    // Generic response
    return `I received your message about "${prompt.substring(0, 50)}...". I'm currently operating in limited mode. For the best experience, please try again later. In the meantime, feel free to browse internships, check company reviews, or update your profile!`;
  }
}