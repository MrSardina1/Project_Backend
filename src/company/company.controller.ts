import { Body, Post, Get, Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/Auth/jwt.auth.guard';
import { RolesGuard } from 'src/Auth/roles.guard';
import { CompanyService } from 'src/company/company.service';
import { Role } from 'src/Auth/roles.enum';
import { Roles } from 'src/Auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Post()
  @Roles(Role.COMPANY)
  create(@Body() body: any) {
    return this.companyService.create(body);
  }

  @Get()
  findAll() {
    return this.companyService.findAll();
  }
}
