import { Body, Post, Get, Controller, UseGuards } from '@nestjs/common';
import { CompanyService } from 'src/company/company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from 'src/Auth/jwt.auth.guard';
import { RolesGuard } from 'src/Auth/roles.guard';
import { Public } from 'src/Auth/public.decorator';

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
}