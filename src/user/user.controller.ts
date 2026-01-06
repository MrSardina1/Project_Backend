import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/Auth/jwt.auth.guard';
import { Roles } from 'src/Auth/roles.decorator';
import { Role } from 'src/Auth/roles.enum';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @UseGuards(JwtAuthGuard)
    @Roles(Role.ADMIN)

    @Post()
    create(@Body() body: CreateUserDto){
        return this.userService.create(body);
    }

    @Get()
    findAll(){
        return this.userService.findAll();
    }
}
