export class DirectorResponseDto {
  id_director: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  direccion?: string;
  id_user?: string;
  usuario?: {
    id_user: string;
    nombre_usuario: string;
    rol_usuario: string;
    profile_image: string;
    activo: boolean;
  };
}
