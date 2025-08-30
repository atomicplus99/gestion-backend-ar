import { Entity, PrimaryGeneratedColumn, Column, OneToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { Alumno } from '../alumno/infraestructure/orm/entities/alumno.entity';
import { Auxiliar } from '../auxiliar/auxiliar.entity';
import { Administrador } from '../administrador/administrador.entity';
import { Director } from '../director/director.entity';


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

  @Column({ type: 'varchar', length: 255, nullable: true, default: 'no-image.png' })
  profile_image: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @OneToOne(() => Alumno, (alumno) => alumno.usuario)
  alumno?: Alumno;

  @OneToOne(() => Auxiliar, (auxiliar) => auxiliar.usuario)
  auxiliar?: Auxiliar;

  @OneToOne(() => Administrador, (administrador) => administrador.usuario)
  administrador?: Administrador;

  @OneToOne(() => Director, (director) => director.usuario)
  director?: Director;

}


