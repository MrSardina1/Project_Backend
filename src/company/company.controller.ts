import { Body, Post, Get, Controller, UseGuards, Req } from '@nestjs/common';
import { CompanyService } from 'src/company/company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from 'src/Auth/jwt.auth.guard';
import { RolesGuard } from 'src/Auth/roles.guard';
import { Roles } from 'src/Auth/roles.decorator';
import { Public } from 'src/Auth/public.decorator';
import { Role } from 'src/Auth/roles.enum';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  // Public endpoint - anyone can register a company
  @Post('register')
  @Public()
  register(@Body() body: CreateCompanyDto) {
    return this.companyService.create(body);
  }

  // Protected endpoint - requires authentication
  @Get()
  findAll() {
    return this.companyService.findAll();
  }

  // New endpoint - link an existing user to a company
  @Post('link-to-user')
  @Roles(Role.ADMIN)
  async linkToUser(
    @Req() req,
    @Body() body: { userId: string; name: string; email: string; description?: string; website?: string }
  ) {
    return this.companyService.linkUserToCompany(body.userId, body);
  }
}