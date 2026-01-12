import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../Auth/roles.enum';

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ required: true })
    username: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({
        type: String,
        enum: Role,
        default: Role.STUDENT,
    })
    role: Role;

    @Prop({ required: false })  // Make optional
    profilePicture?: string;

    @Prop({ required: false })  // Make optional
    bio?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);