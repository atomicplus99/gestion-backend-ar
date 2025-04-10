import { IsString, IsInt, IsNotEmpty, MinLength, IsEnum } from 'class-validator';
import { RolUsuario } from 'src/common/enums/rol-usuario.enum';

export class LoginDto {

  @IsString()
  @IsNotEmpty()
  @MinLength(3) 
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3) 
  password: string;

}