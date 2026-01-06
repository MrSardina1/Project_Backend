import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
    ) {}

    async create(userData: any){
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

        return this.userModel.create({
            ...userData,
            password: hashedPassword,
        })
    }

    async findAll() {
        return this.userModel.find();
    }

    async findByEmail(email: string) {
        return this.userModel.findOne({ email });
    }
}
