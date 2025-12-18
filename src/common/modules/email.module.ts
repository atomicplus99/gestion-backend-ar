import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BrevoService } from '../services/brevo.service';
import { TokenService } from '../services/token.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ||
            '1h') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [BrevoService, TokenService],
  exports: [BrevoService, TokenService],
})
export class EmailModule {}
