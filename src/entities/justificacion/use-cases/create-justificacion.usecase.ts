import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Justificacion } from '../justificacion.entity';
import { Alumno } from '../../alumno/infraestructure/orm/entities/alumno.entity';
import { Auxiliar } from '../../auxiliar/auxiliar.entity';
import { CreateJustificacionDto } from '../dto/create-justificacion.dto';
import { JustificacionResponseDto } from '../dto/justificacion-response.dto';

@Injectable()
export class CreateJustificacionUseCase {
  constructor(
    @InjectRepository(Justificacion)
    private readonly justificacionRepository: Repository<Justificacion>,
    
    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,
    
    @InjectRepository(Auxiliar)
    private readonly auxiliarRepository: Repository<Auxiliar>,
  ) {}

  async execute(dto: CreateJustificacionDto): Promise<JustificacionResponseDto> {
    // 1. Validar que el alumno existe
    const alumno = await this.alumnoRepository.findOne({
      where: { id_alumno: dto.id_alumno },
      relations: ['turno'],
    });

    if (!alumno) {
      throw new NotFoundException(`No se encontró ningún alumno con el ID: ${dto.id_alumno}`);
    }

    // 2. Validar que el auxiliar existe
    const auxiliar = await this.auxiliarRepository.findOne({
      where: { id_auxiliar: dto.id_auxiliar },
    });

    if (!auxiliar) {
      throw new NotFoundException(`No se encontró ningún auxiliar con el ID: ${dto.id_auxiliar}`);
    }

    // 3. Validar formato de fechas (DD-MM-YYYY)
    this.validarFormatoFechas(dto.fecha_de_justificacion);

    // 4. Crear la justificación
    const justificacion = this.justificacionRepository.create({
      alumno,
      auxiliar,
      tipo_justificacion: dto.tipo_justificacion,
      motivo: dto.motivo,
      fecha_de_justificacion: dto.fecha_de_justificacion,
      documentos_adjuntos: dto.documentos_adjuntos || [],
      estado: 'PENDIENTE' as any, // Estado inicial
    });

    // 5. Guardar la justificación
    const justificacionGuardada = await this.justificacionRepository.save(justificacion);

    // 6. Construir la respuesta
    const response: JustificacionResponseDto = {
      id_justificacion: justificacionGuardada.id_justificacion,
      alumno: {
        id_alumno: alumno.id_alumno,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        codigo: alumno.codigo,
      },
      auxiliar: {
        id_auxiliar: auxiliar.id_auxiliar,
        nombre: auxiliar.nombre || 'Auxiliar',
        apellido: auxiliar.apellido || 'Sistema',
      },
      tipo_justificacion: justificacionGuardada.tipo_justificacion,
      motivo: justificacionGuardada.motivo,
      fecha_de_justificacion: justificacionGuardada.fecha_de_justificacion,
      documentos_adjuntos: justificacionGuardada.documentos_adjuntos,
      estado: justificacionGuardada.estado,
      fecha_creacion: justificacionGuardada.fecha_creacion,
      fecha_actualizacion: justificacionGuardada.fecha_actualizacion,
    };

    return response;
  }

  private validarFormatoFechas(fechas: string[]): void {
    const formatoFechaRegex = /^\d{2}-\d{2}-\d{4}$/;
    
    for (const fecha of fechas) {
      if (!formatoFechaRegex.test(fecha)) {
        throw new BadRequestException(
          `Formato de fecha inválido: ${fecha}. Use el formato DD-MM-YYYY`
        );
      }

      // Validar que la fecha sea válida
      const [dia, mes, año] = fecha.split('-').map(Number);
      const fechaDate = new Date(año, mes - 1, dia);
      
      if (fechaDate.getDate() !== dia || 
          fechaDate.getMonth() !== mes - 1 || 
          fechaDate.getFullYear() !== año) {
        throw new BadRequestException(`Fecha inválida: ${fecha}`);
      }

      // Permitir fechas futuras para justificaciones anticipadas
      // const hoy = new Date();
      // hoy.setHours(0, 0, 0, 0);
      
      // if (fechaDate > hoy) {
      //   throw new BadRequestException(`No se puede justificar una fecha futura: ${fecha}`);
      // }
    }
  }
}
