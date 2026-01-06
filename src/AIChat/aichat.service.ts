import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AIChat, AIChatDocument } from './aichat.schema';
import OpenAI from 'openai';

@Injectable()
export class AIChatService {
  private openai: OpenAI;
  private useFallback: boolean = false;

  constructor(@InjectModel(AIChat.name) private chatModel: Model<AIChatDocument>) {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }

  async ask(userId: string, prompt: string) {
    try {
      // Try OpenAI first
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const answer = response.choices[0].message.content;

      const chat = new this.chatModel({
        user: userId,
        prompt,
        response: answer,
        provider: 'openai',
      });

      await chat.save();
      return answer;
      
    } catch (error) {
      console.error('OpenAI Error:', error.message);
      
      // Fallback to a free service
      return this.fallbackAI(userId, prompt);
    }
  }

  private async fallbackAI(userId: string, prompt: string): Promise<string> {
    try {
      // Option 1: Use Node.js built-in fetch (no additional packages needed)
      const response = await fetch(
        'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: prompt }),
        }
      );

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status}`);
      }

      const data = await response.json();
      const answer = data[0]?.generated_text || 'No response from AI';

      const chat = new this.chatModel({
        user: userId,
        prompt,
        response: answer,
        provider: 'huggingface',
      });

      await chat.save();
      return answer;

    } catch (fallbackError) {
      console.error('Fallback AI Error:', fallbackError.message);
      
      // Ultimate fallback - simple rule-based response
      const ultimateFallback = this.getRuleBasedResponse(prompt);
      
      const chat = new this.chatModel({
        user: userId,
        prompt,
        response: ultimateFallback,
        provider: 'fallback',
        error: fallbackError.message,
      });
      
      await chat.save();
      return ultimateFallback;
    }
  }

  private getRuleBasedResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    // Simple rule-based responses
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      return "Hello! I'm currently operating in limited mode. How can I assist you?";
    }
    if (lowerPrompt.includes('weather')) {
      return "I cannot check real-time weather data right now. Please check a weather service like Weather.com.";
    }
    if (lowerPrompt.includes('time')) {
      return `The current time is approximately ${new Date().toLocaleTimeString()}.`;
    }
    if (lowerPrompt.includes('name')) {
      return "I'm an AI assistant operating in fallback mode.";
    }
    
    // Generic response
    return `I've received your message: "${prompt.substring(0, 100)}...". Due to service limitations, I'm providing limited responses. Please check your AI service billing or try again later.`;
  }
}