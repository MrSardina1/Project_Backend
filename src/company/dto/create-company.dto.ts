import { IsNotEmpty, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCompanyDto {
    // Company info
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    website?: string;

    // User account info
    @IsNotEmpty()
    @IsString()
    username: string;

    @IsEmail()
    email: string;

    @MinLength(6)
    password: string;
}