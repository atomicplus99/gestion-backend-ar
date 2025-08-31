import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BrevoService } from '../services/brevo.service';
import { TokenService } from '../services/token.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
    }),
  ],
  providers: [BrevoService, TokenService],
  exports: [BrevoService, TokenService],
})
export class EmailModule {}
