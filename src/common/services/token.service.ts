import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(private readonly jwtService: JwtService) {}

  generatePasswordResetToken(userId: string, email: string): string {
    try {
      const payload = {
        sub: userId,
        email: email,
        type: 'password_reset',
        iat: Math.floor(Date.now() / 1000),
      };

      const token = this.jwtService.sign(payload, {
        expiresIn: (process.env.JWT_RESET_EXPIRES_IN || '1h') as any,
        secret: process.env.JWT_SECRET,
      });

      return token;
    } catch (error) {
      throw error;
    }
  }

  verifyPasswordResetToken(token: string): {
    userId: string;
    email: string;
    valid: boolean;
  } {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      if (payload.type !== 'password_reset') {
        return { userId: '', email: '', valid: false };
      }

      return { userId: payload.sub, email: payload.email, valid: true };
    } catch (error) {
      return { userId: '', email: '', valid: false };
    }
  }

  generateAuthToken(payload: any): string {
    try {
      return this.jwtService.sign(payload, {
        expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as any,
        secret: process.env.JWT_SECRET,
      });
    } catch (error) {
      throw error;
    }
  }
}
