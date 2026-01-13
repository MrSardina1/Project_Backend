import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument } from '../user/user.schema';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    try {
      const { username, email, password, role } = registerDto;

      console.log('Register called with:', { username, email, role });

      if (!username || !email || !password) {
        throw new BadRequestException('Username, email, and password are required');
      }

      const existingUser = await this.userModel.findOne({ email });
      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const user = new this.userModel({
        name: username, // Use username as name for students
        username: username,
        email,
        password: hashedPassword,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        isEmailVerified: false,
        role: role || 'STUDENT',
      });

      console.log('Saving user:', { username, email, role });
      await user.save();
      console.log('User saved successfully');

      // Send verification email - DON'T await to avoid blocking
      try {
        console.log('Sending verification email...');
        await this.emailService.sendVerificationEmail(email, verificationToken);
        console.log('Verification email sent successfully');
      } catch (emailError) {
        console.error('Failed to send verification email, but user was created:', emailError);
        // Don't throw - user is already created, just warn them
        return {
          message: 'Registration successful! However, we could not send the verification email. Please contact support.',
        };
      }

      return {
        message: 'Registration successful! Please check your email to verify your account.',
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async registerCompany(registerDto: RegisterDto): Promise<{ message: string }> {
    try {
      const { name, username, email, password, website, description } = registerDto;

      console.log('Company register called with:', { name, username, email });

      if (!name || !username || !email || !password) {
        throw new BadRequestException('Company name, username, email, and password are required');
      }

      const existingUser = await this.userModel.findOne({ email });
      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const user = new this.userModel({
        name: name, // Company name
        username: username,
        email,
        password: hashedPassword,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        isEmailVerified: false,
        role: 'COMPANY',
      });

      console.log('Saving company user:', { name, username, email });
      await user.save();
      console.log('Company user saved successfully');

      // Send verification email - DON'T throw if it fails
      try {
        console.log('Sending verification email...');
        await this.emailService.sendVerificationEmail(email, verificationToken);
        console.log('Verification email sent successfully');
      } catch (emailError) {
        console.error('Failed to send verification email, but user was created:', emailError);
        return {
          message: 'Company registration successful! However, we could not send the verification email. Please contact support.',
        };
      }

      return {
        message: 'Company registration successful! Please check your email to verify your account.',
      };
    } catch (error) {
      console.error('Company registration error:', error);
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<{ message: string; access_token?: string; user?: any }> {
    const user = await this.userModel.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Auto-login after verification
    const payload = { sub: user._id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      message: 'Email verified successfully! You are now logged in.',
      access_token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    await this.emailService.sendVerificationEmail(email, verificationToken);

    return { message: 'Verification email sent successfully!' };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string; user: any }> {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user._id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      // Don't reveal if email exists
      return {
        message: 'If the email exists, a password reset link has been sent.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    await this.emailService.sendPasswordResetEmail(email, resetToken);

    return {
      message: 'If the email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: 'Password reset successfully! You can now login.' };
  }

  // TEST METHOD - Remove in production
  async testEmailConnection(email: string): Promise<{ message: string; details?: any }> {
    try {
      console.log('Testing email connection...');
      await this.emailService.sendVerificationEmail(email, 'test-token-123');
      return { 
        message: 'Test email sent successfully! Check your inbox.',
        details: 'If you don\'t receive it, check SMTP configuration'
      };
    } catch (error) {
      console.error('Email test failed:', error);
      return { 
        message: 'Email test failed',
        details: error.message
      };
    }
  }
}