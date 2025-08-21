import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';

import { UsuarioModule } from 'src/entities/usuario/usuario.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtDefaultService } from './services/jwt.service';
import { AlumnoModule } from 'src/entities/alumno/alumno.module';
import { AuxiliarModule } from 'src/entities/auxiliar/auxiliar.module';




@Module({
  imports: [UsuarioModule, AlumnoModule, AuxiliarModule,
      JwtModule.register({
        secret: process.env.JWT_SECRET || 'mi_clave_super_secreta',
        signOptions: { expiresIn: '1h' },
      }),
  ],
  providers: [AuthService, JwtDefaultService],
  controllers: [AuthController],
  
})
export class AuthModule {}
