import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.access_token || null,
      ]),
      secretOrKey: process.env.JWT_SECRET!, 
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    return {
        idUser: payload.idUser,
        username: payload.username,
        userRole: payload.userRole,
        profile_image: payload.profile_image
    };
  }
}
