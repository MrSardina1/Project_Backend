import { Controller, Post, Get, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from 'src/Auth/jwt.auth.guard';
import { RolesGuard } from 'src/Auth/roles.guard';
import { Roles } from 'src/Auth/roles.decorator';
import { Role } from 'src/Auth/roles.enum';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // STUDENT creates a review
  @Post()
  @Roles(Role.STUDENT)
  async create(@Req() req, @Body() dto: CreateReviewDto) {
    return this.reviewService.create(
      req.user.userId,
      dto.companyId,
      dto.rating,
      dto.comment,
    );
  }

  // Public - Get reviews for a specific company
  @Get('company/:companyId')
  async getCompanyReviews(@Param('companyId') companyId: string) {
    return this.reviewService.findByCompany(companyId);
  }

  // STUDENT - Get my reviews
  @Get('my-reviews')
  @Roles(Role.STUDENT)
  async getMyReviews(@Req() req) {
    return this.reviewService.findMyReviews(req.user.userId);
  }

  // STUDENT updates their own review
  @Patch(':id')
  @Roles(Role.STUDENT)
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewService.update(
      id,
      req.user.userId,
      dto.rating,
      dto.comment,
    );
  }

  // STUDENT and ADMIN can delete reviews
  @Delete(':id')
  @Roles(Role.STUDENT, Role.ADMIN)
  async delete(@Req() req, @Param('id') id: string) {
    return this.reviewService.delete(
      id,
      req.user.userId,
      req.user.role,
    );
  }

  // ADMIN only - Get all reviews
  @Get()
  @Roles(Role.ADMIN)
  async findAll() {
    return this.reviewService.findAll();
  }
}