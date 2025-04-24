// src/alumno/alumno.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alumno } from '../../infraestructure/orm/entities/alumno.entity';
import { Turno } from '../../../turno/turno.entity';
import { Usuario } from '../../../usuario/usuario.entity';
import { CreateAlumnoDto } from 'src/auth/dto/users/create-alumno.dto';
import { v4 as uuidv4 } from 'uuid';
import { AlumnoDto } from 'src/auth/dto/alumno/alumno.dto';

@Injectable()
export class AlumnoService {
  constructor(
    @InjectRepository(Alumno)
    private readonly alumnoRepo: Repository<Alumno>,

    @InjectRepository(Turno)
    private readonly turnoRepo: Repository<Turno>,

    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async create(alumnoDtaRequest: AlumnoDto): Promise<Alumno> {
    
    const turno = await this.loadTurno(alumnoDtaRequest.turno_id);
    const alumno = this.alumnoRepo.create()

    // const alumno = this.alumnoRepo.create({
    //   codigo: alumnoDtaRequest.codigo,
    //   dni_alumno: alumnoDtaRequest.dni_alumno,
    //   nombre: alumnoDtaRequest.nombre,
    //   apellido: alumnoDtaRequest.apellido,
    //   fecha_nacimiento: new Date(alumnoDtaRequest.fecha_nacimiento),
    //   direccion: alumnoDtaRequest.direccion,
    //   codigo_qr: alumnoDtaRequest.codigo_qr,
    //   nivel: alumnoDtaRequest.nivel,
    //   grado: alumnoDtaRequest.grado,
    //   seccion: alumnoDtaRequest.seccion,
    //   id_alumno: alumnoDtaRequest.usuario_id,
    //   turno,
    // });

  
    return this.alumnoRepo.save(alumno);
    
  }























  async findAll(): Promise<Alumno[]> {
    return this.alumnoRepo.find({ relations: ['turno', 'usuario'] });
  }


  async findOne(id: string): Promise<Alumno> {
    const alumno = await this.alumnoRepo.findOne({
      where: { id_alumno: id },
      relations: ['turno', 'usuario'],
    });
    if (!alumno) {
      throw new NotFoundException(`Alumno ${id} no encontrado`);
    }
    return alumno;
  }

  async update(id: string, dto: CreateAlumnoDto): Promise<Alumno> {
    const alumno = await this.findOne(id);

    if (dto.codigo && dto.codigo !== alumno.codigo) {
      const codeExists = await this.alumnoRepo.findOne({ where: { codigo: dto.codigo } });
      if (codeExists) {
        throw new BadRequestException(`Código '${dto.codigo}' ya registrado.`);
      }
      alumno.codigo = dto.codigo;
    }

    alumno.dni_alumno      = dto.dni_alumno;
    alumno.nombre          = dto.nombre;
    alumno.apellido        = dto.apellido;
    alumno.fecha_nacimiento = new Date(dto.fecha_nacimiento);
    alumno.direccion       = dto.direccion || 'dsad';
    alumno.codigo_qr       = dto.codigo_qr;
    alumno.nivel           = dto.nivel;
    alumno.grado           = dto.grado;
    alumno.seccion         = dto.seccion;
    alumno.turno           = await this.loadTurno(dto.turno_id);

    if (dto.usuario_id) {
      alumno.usuario = await this.loadUsuario(dto.usuario_id);
    }
    // si no viene usuario_id, dejamos el actual sin modificar

    return this.alumnoRepo.save(alumno);
  }

  async importarDesdeExcel(data: any[]): Promise<Alumno[]> {
    const codigos = data.map(d => d.codigo);
    const dupes = await this.alumnoRepo
      .createQueryBuilder('alumno')
      .where('alumno.codigo IN (:...codigos)', { codigos })
      .getMany();
    if (dupes.length) {
      const list = dupes.map(a => a.codigo).join(', ');
      throw new BadRequestException(`Códigos duplicados: ${list}`);
    }

    const toSave = data.map(item =>
      this.alumnoRepo.create({
        codigo: item.codigo,
        dni_alumno: item.dni || '00000000',
        nombre: item.nombre,
        apellido: item.apellido,
        fecha_nacimiento: new Date(item.fechaNacimiento),
        direccion: item.direccion || 'sin dirección',
        codigo_qr: uuidv4(),
        nivel: item.nivel,
        grado: Number(item.grado),
        seccion: item.seccion,
        turno: undefined,
      }),
    );

    return this.alumnoRepo.save(toSave);
  }

  /** Helpers **/

  private async loadTurno(id: string): Promise<Turno> {
    const turno = await this.turnoRepo.findOne({ where: { id_turno: id } });
    if (!turno) throw new NotFoundException('Turno no encontrado');
    return turno;
  }

  private async loadUsuario(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepo.findOne({ where: { id_user: id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const assigned = await this.alumnoRepo.findOne({
      where: { usuario: { id_user: id } },
    });
    if (assigned) {
      throw new BadRequestException('Usuario ya asignado a otro alumno');
    }

    return usuario;
  }
}
