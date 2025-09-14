import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Justificacion } from '../justificacion.entity';
import { Alumno } from '../../alumno/infraestructure/orm/entities/alumno.entity';
import { Auxiliar } from '../../auxiliar/auxiliar.entity';
import { Administrador } from '../../administrador/administrador.entity';
import { Director } from '../../director/director.entity';
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

    @InjectRepository(Administrador)
    private readonly administradorRepository: Repository<Administrador>,

    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
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

    // 2. Validar que se proporcione al menos un actor y buscar cuál es
    let auxiliar: Auxiliar | null = null;
    let administrador: Administrador | null = null;
    let director: Director | null = null;

    if (dto.id_auxiliar) {
      auxiliar = await this.auxiliarRepository.findOne({
        where: { id_auxiliar: dto.id_auxiliar },
      });
      if (!auxiliar) {
        throw new NotFoundException(`No se encontró ningún auxiliar con el ID: ${dto.id_auxiliar}`);
      }
    } else if (dto.id_administrador) {
      administrador = await this.administradorRepository.findOne({
        where: { id_administrador: dto.id_administrador },
      });
      if (!administrador) {
        throw new NotFoundException(`No se encontró ningún administrador con el ID: ${dto.id_administrador}`);
      }
    } else if (dto.id_director) {
      director = await this.directorRepository.findOne({
        where: { id_director: dto.id_director },
      });
      if (!director) {
        throw new NotFoundException(`No se encontró ningún director con el ID: ${dto.id_director}`);
      }
    } else if (dto.id_usuario) {
      // Buscar en auxiliares primero
      auxiliar = await this.auxiliarRepository.findOne({
        where: { id_auxiliar: dto.id_usuario },
      });
      if (auxiliar) {
        // Es un auxiliar
      } else {
        // Buscar en administradores
        administrador = await this.administradorRepository.findOne({
          where: { id_administrador: dto.id_usuario },
        });
        if (administrador) {
          // Es un administrador
        } else {
          // Buscar en directores
          director = await this.directorRepository.findOne({
            where: { id_director: dto.id_usuario },
          });
          if (!director) {
            throw new NotFoundException(`No se encontró ningún usuario con el ID: ${dto.id_usuario}`);
          }
        }
      }
    } else {
      throw new BadRequestException('Debe proporcionar al menos un ID de auxiliar, administrador, director o usuario');
    }

    // 3. Validar formato de fechas (DD-MM-YYYY)
    this.validarFormatoFechas(dto.fecha_de_justificacion);

    // 4. Validar que no existan justificaciones duplicadas para las mismas fechas
    await this.validarFechasNoDuplicadas(dto.id_alumno, dto.fecha_de_justificacion);

    // 5. Crear la justificación
    // Obtener fecha actual en hora de Perú (UTC-5)
    const ahora = new Date();
    const horaPeru = new Date(ahora.toLocaleString("en-US", {timeZone: "America/Lima"}));
    
    const justificacionData: Partial<Justificacion> = {
      alumno,
      tipo_justificacion: dto.tipo_justificacion,
      motivo: dto.motivo,
      fecha_de_justificacion: dto.fecha_de_justificacion,
      documentos_adjuntos: dto.documentos_adjuntos || [],
      estado: 'PENDIENTE' as any, // Estado inicial
      fecha_creacion: horaPeru, // Fecha en hora de Perú
      fecha_actualizacion: horaPeru, // Fecha en hora de Perú
    };

    // Agregar el actor correspondiente
    if (auxiliar) {
      justificacionData.auxiliar = auxiliar;
    }
    if (administrador) {
      justificacionData.administrador = administrador;
    }
    if (director) {
      justificacionData.director = director;
    }

    const justificacion = this.justificacionRepository.create(justificacionData);

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
      auxiliar: auxiliar ? {
        id_auxiliar: auxiliar.id_auxiliar,
        nombre: auxiliar.nombre || 'Auxiliar',
        apellido: auxiliar.apellido || 'Sistema',
      } : undefined,
      administrador: administrador ? {
        id_administrador: administrador.id_administrador,
        nombre: administrador.nombres || 'Administrador',
        apellido: administrador.apellidos || 'Sistema',
      } : undefined,
      director: director ? {
        id_director: director.id_director,
        nombre: director.nombres || 'Director',
        apellido: director.apellidos || 'Sistema',
      } : undefined,
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

  private async validarFechasNoDuplicadas(idAlumno: string, fechasNuevas: string[]): Promise<void> {
    console.log(`🔍 Validando fechas duplicadas para alumno: ${idAlumno}`);
    console.log(`📅 Fechas a validar: ${fechasNuevas.join(', ')}`);

    // Buscar todas las justificaciones existentes del alumno (excepto las anuladas)
    const justificacionesExistentes = await this.justificacionRepository
      .createQueryBuilder('justificacion')
      .leftJoinAndSelect('justificacion.alumno', 'alumno')
      .where('alumno.id_alumno = :idAlumno', { idAlumno })
      .andWhere('justificacion.estado != :estadoAnulado', { estadoAnulado: 'ANULADO' })
      .getMany();

    console.log(`📊 Justificaciones existentes encontradas: ${justificacionesExistentes.length}`);

    if (justificacionesExistentes.length === 0) {
      console.log(`✅ No hay justificaciones existentes - PERMITIENDO crear nueva justificación`);
      return;
    }

    // Crear un Set con todas las fechas ya justificadas
    const fechasYaJustificadas = new Set<string>();
    
    for (const justificacion of justificacionesExistentes) {
      if (justificacion.fecha_de_justificacion && justificacion.fecha_de_justificacion.length > 0) {
        for (const fecha of justificacion.fecha_de_justificacion) {
          fechasYaJustificadas.add(fecha);
          console.log(`📅 Fecha ya justificada: ${fecha} (Justificación ID: ${justificacion.id_justificacion})`);
        }
      }
    }

    // Verificar si alguna de las fechas nuevas ya está justificada
    const fechasDuplicadas: string[] = [];
    
    for (const fechaNueva of fechasNuevas) {
      if (fechasYaJustificadas.has(fechaNueva)) {
        fechasDuplicadas.push(fechaNueva);
        console.log(`❌ Fecha duplicada encontrada: ${fechaNueva}`);
      }
    }

    if (fechasDuplicadas.length > 0) {
      const fechasDuplicadasStr = fechasDuplicadas.join(', ');
      console.log(`🚫 BLOQUEANDO creación - Fechas duplicadas: ${fechasDuplicadasStr}`);
      
      throw new BadRequestException(
        `No se puede crear la justificación. El alumno ya tiene justificaciones registradas para las siguientes fechas: ${fechasDuplicadasStr}. ` +
        `Por favor, seleccione fechas diferentes que no estén ya justificadas.`
      );
    }

    console.log(`✅ Todas las fechas son válidas - PERMITIENDO crear nueva justificación`);
  }
}
