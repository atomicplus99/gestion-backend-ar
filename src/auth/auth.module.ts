import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';

import { UsuarioModule } from 'src/entities/usuario/usuario.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtDefaultService } from './services/jwt.service';
import { AlumnoModule } from 'src/entities/alumno/alumno.module';
import { AuxiliarModule } from 'src/entities/auxiliar/auxiliar.module';
import { ConfigModule, ConfigService } from '@nestjs/config';




@Module({
  imports: [UsuarioModule, AlumnoModule, AuxiliarModule, ConfigModule,
      JwtModule.registerAsync({
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { 
            expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h' 
          },
        }),
        inject: [ConfigService],
      }),
  ],
  providers: [AuthService, JwtDefaultService],
  controllers: [AuthController],
  
})
export class AuthModule {}
