import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { Alumno } from '../alumno/infraestructure/orm/entities/alumno.entity';
import { Auxiliar } from '../auxiliar/auxiliar.entity';


@Entity('USUARIO')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id_user: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  nombre_usuario: string;

  @Column({ type: 'varchar', length: 100 })
  password_user: string;

  @Column({ type: 'enum', enum: RolUsuario })
  rol_usuario: RolUsuario;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profile_image: string;

  @OneToOne(() => Alumno, (alumno) => alumno.usuario)
  alumno?: Alumno;

  @OneToOne(() => Auxiliar, (auxiliar) => auxiliar.usuario)
  auxiliar?: Auxiliar;

}


