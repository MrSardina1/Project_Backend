import { IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import { Role } from 'src/Auth/roles.enum';

export class CreateUserDto {
    @IsNotEmpty()
    username: string;

    @IsEmail()
    email: string;

    @MinLength(6)
    password: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}