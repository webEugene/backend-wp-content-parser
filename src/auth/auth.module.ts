import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  imports: [
    forwardRef(() => UsersModule),
    // registerAsync: секрет читається після того, як ConfigModule завантажив .env.
    // JwtModule.register() читав process.env під час імпорту файлу — ще до .env.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET_NAME');
        if (!secret) {
          throw new Error('JWT_SECRET_NAME is not set');
        }
        return {
          secret,
          signOptions: { expiresIn: '24h' },
        };
      },
    }),
  ],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
