import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    console.log('Received registration data:', registerDto);
    return this.authService.register(registerDto);
  }

  @Post('register-company')
  async registerCompany(@Body() registerDto: RegisterDto) {
    console.log('Received company registration data:', registerDto);
    return this.authService.registerCompany(registerDto);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.login(email, password);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('password') newPassword: string,
  ) {
    return this.authService.resetPassword(token, newPassword);
  }

  // TEST ENDPOINT - Remove in production
  @Post('test-email')
  async testEmail(@Body('email') email: string) {
    return this.authService.testEmailConnection(email);
  }
}