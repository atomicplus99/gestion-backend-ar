import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';


@Entity('ESTADO_ALUMNO')
export class EstadoAlumno {
  @PrimaryGeneratedColumn('uuid')
  id_estado: string;

  @Column({ type: 'varchar', length: 20, default: 'activo' })
  estado: 'activo' | 'inactivo';

  @Column({ type: 'varchar', length: 255, nullable: true })
  observacion: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_actualizacion: Date;

  @Column({ type: 'uuid' })
  id_alumno: string;
}
