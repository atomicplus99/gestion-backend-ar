import { Injectable } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';

import { User } from "src/entities/usuario/usuario.interface";

@Injectable()
export class JwtDefaultService {

    constructor(private readonly jwtService: JwtService) {}

    generateToken(payload: User): string {
        return this.jwtService.sign(payload);
    }

    verifyToken(token: string): any {
        return this.jwtService.verify(token);
    }
  
  

}