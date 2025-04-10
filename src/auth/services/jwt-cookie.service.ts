import { Injectable} from '@nestjs/common';
import { Response} from 'express';

@Injectable()
export class JwtCookieService {
  
  setAuthCookie(res: Response, token: string): void {
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
      path: '/', 
    });
  }

  clearCookie(res:Response){
    res.clearCookie('access_token',{
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    })
  }
}
