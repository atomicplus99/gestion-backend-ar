import { RolUsuario } from '../../../common/enums/rol-usuario.enum';

export class UsuarioResponseDto {
  id_user: string;
  nombre_usuario: string;
  rol_usuario: RolUsuario;
  profile_image: string;
  activo: boolean;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}
