import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/Auth/jwt.auth.guard';
import { RolesGuard } from 'src/Auth/roles.guard';
import { Roles } from 'src/Auth/roles.decorator';
import { Role } from 'src/Auth/roles.enum';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  // Dashboard stats
  @Get('stats')
  getStats() {
    return this.adminService.getDashboardStats();
  }

  // User management
  @Get('users')
  getAllUsers(
    @Query('sortBy') sortBy?: string,
    @Query('filterBy') filterBy?: string,
    @Query('filterValue') filterValue?: string,
    @Query('status') status?: string
  ) {
    return this.adminService.getAllUsers(sortBy, filterBy, filterValue, status);
  }

  @Get('users/:id')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateUser(id, data);
  }

  @Post('users')
  createUser(@Body() data: any) {
    return this.adminService.createUser(data);
  }

  @Patch('users/:id/role')
  updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.adminService.updateRole(id, role);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Delete('users/:id/soft')
  softDeleteUser(@Param('id') id: string) {
    return this.adminService.softDeleteUser(id);
  }

  @Patch('users/:id/restore')
  restoreUser(@Param('id') id: string) {
    return this.adminService.restoreUser(id);
  }

  // Company management
  @Get('companies')
  getAllCompanies(
    @Query('sortBy') sortBy?: string,
    @Query('filterBy') filterBy?: string,
    @Query('filterValue') filterValue?: string,
    @Query('status') status?: string
  ) {
    return this.adminService.getAllCompanies(sortBy, filterBy, filterValue, status);
  }

  @Get('companies/pending')
  getPendingCompanies() {
    return this.adminService.getPendingCompanies();
  }

  @Get('companies/active')
  getActiveCompanies() {
    return this.adminService.getActiveCompanies();
  }

  @Get('companies/stats')
  getCompaniesWithStats() {
    return this.adminService.getCompaniesWithInternshipCounts();
  }

  @Patch('companies/:id/verify')
  verifyCompany(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.verifyCompany(id, status);
  }

  @Patch('companies/:id')
  updateCompany(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateCompany(id, data);
  }

  @Delete('companies/:id')
  deleteCompany(@Param('id') id: string) {
    return this.adminService.deleteCompany(id);
  }

  @Patch('companies/:id/restore')
  restoreCompany(@Param('id') id: string) {
    return this.adminService.restoreCompany(id);
  }

  // Internship management
  @Get('internships')
  getAllInternships(
    @Query('sortBy') sortBy?: string,
    @Query('filterBy') filterBy?: string,
    @Query('filterValue') filterValue?: string,
    @Query('company') company?: string
  ) {
    return this.adminService.getAllInternships(sortBy, filterBy, filterValue, company);
  }

  @Delete('internships/:id')
  deleteInternship(@Param('id') id: string) {
    return this.adminService.deleteInternship(id);
  }

  // Application management
  @Get('applications')
  getAllApplications() {
    return this.adminService.getAllApplications();
  }

  // Review management
  @Get('reviews')
  getAllReviews(
    @Query('company') company?: string,
    @Query('reviewer') reviewer?: string
  ) {
    return this.adminService.getAllReviews(company, reviewer);
  }

  @Get('reviews/companies')
  getCompaniesWithReviewCounts() {
    return this.adminService.getCompaniesWithReviewCounts();
  }

  @Delete('reviews/:id')
  deleteReview(@Param('id') id: string) {
    return this.adminService.deleteReview(id);
  }
}