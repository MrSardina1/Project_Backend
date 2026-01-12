import { 
  Controller, 
  Get, 
  Patch, 
  Body, 
  Param, 
  UseGuards, 
  Req, 
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from 'src/Auth/jwt.auth.guard';
import { ProfileService } from './profile.service';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // Get own profile
  @Get('me')
  getMyProfile(@Req() req) {
    return this.profileService.getProfile(req.user.userId, req.user.role);
  }

  // Get any user's profile (public)
  @Get('user/:id')
  getUserProfile(@Param('id') id: string) {
    return this.profileService.getUserProfile(id);
  }

  // Get any company's profile (public)
  @Get('company/:id')
  getCompanyProfile(@Param('id') id: string) {
    return this.profileService.getCompanyProfile(id);
  }

  // Update own profile
  @Patch('me')
  updateMyProfile(@Req() req, @Body() data: any) {
    return this.profileService.updateProfile(req.user.userId, req.user.role, data);
  }

  // Change password
  @Patch('change-password')
  changePassword(
    @Req() req,
    @Body() data: { oldPassword: string; newPassword: string }
  ) {
    return this.profileService.changePassword(
      req.user.userId,
      data.oldPassword,
      data.newPassword
    );
  }

  // Upload profile picture
  @Patch('profile-picture')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profiles',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `profile-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new BadRequestException('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
    })
  )
  uploadProfilePicture(@Req() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.profileService.updateProfilePicture(
      req.user.userId,
      req.user.role,
      file.filename
    );
  }

  // Remove profile picture
  @Patch('remove-picture')
  removeProfilePicture(@Req() req) {
    return this.profileService.removeProfilePicture(req.user.userId, req.user.role);
  }
}