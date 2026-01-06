import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => {
        console.log('Connexion To MongoDB... ');
        return {
          uri: process.env.MONGODB_URI,
          onConnectionCreate: (connection) => {
            connection.on('connected', () => {
              console.log('MongoDB connected successfully');
            });

            connection.on('error', (err) => {
              console.error('MongoDB connection error:', err);
            });
            
            return connection;
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {
  static forRoot() {
    return MongooseModule.forRoot(process.env.MONGODB_URI!);
  }
}