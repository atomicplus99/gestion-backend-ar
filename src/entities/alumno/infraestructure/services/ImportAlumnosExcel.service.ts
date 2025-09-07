import { Injectable } from '@nestjs/common';
import { ImportAlumnosExcelPort } from '../../domain/ports/outbound/interfaces/ImportAlumnosExcelPort.interface';
import { AlumnoExcelData } from '../../domain/dtos/ImportAlumnosExcel.dto';
import { ImportAlumnosExcelResponse } from '../../domain/dtos/ImportAlumnosExcelResponse.dto';
import { ImportAlumnosExcelMapper } from '../mappers/ImportAlumnosExcel.mapper';
import { UsuarioMapper } from '../mappers/UsuarioMapper.mapper';
import { AlumnoTypeOrmRepository } from '../adapters/outbounds/repository/alumno.repository';
import { UsuarioTypeOrmRepository } from '../../../usuario/repository/usuario.repository';
import { DataSource } from 'typeorm';
import { EstadoAlumno } from '../../../estado-alumnos/entities/estado-alumno.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImportAlumnosExcelService implements ImportAlumnosExcelPort {
  constructor(
    private readonly alumnoRepository: AlumnoTypeOrmRepository,
    private readonly usuarioRepository: UsuarioTypeOrmRepository,
    private readonly importMapper: ImportAlumnosExcelMapper,
    private readonly usuarioMapper: UsuarioMapper,
    private readonly dataSource: DataSource
  ) {}

  async importarAlumnos(
    alumnosExcel: AlumnoExcelData[],
    turnoId: string,
    crearUsuarios: boolean
  ): Promise<ImportAlumnosExcelResponse> {
    const startTime = Date.now();
    
    try {
      // Filtrar y validar datos
      const alumnosValidos = alumnosExcel.filter(alumno => 
        this.importMapper.validateAlumnoData(alumno)
      );

      if (alumnosValidos.length === 0) {
        return this.generarRespuestaError(
          'No hay datos válidos para importar',
          [],
          startTime,
          alumnosExcel.length
        );
      }

      // Verificar duplicados de DNI en la base de datos
      const dnis = alumnosValidos.map(alumno => this.importMapper.mapDNI(alumno)).filter(Boolean);
      if (dnis.length > 0) {
        const dupesDNI = await this.dataSource
          .getRepository('ALUMNO')
          .createQueryBuilder('alumno')
          .where('alumno.dni_alumno IN (:...dnis)', { dnis })
          .getMany();
          
        if (dupesDNI.length) {
          const list = dupesDNI.map(a => a.dni_alumno).join(', ');
          return this.generarRespuestaError(
            `DNIs duplicados en la base de datos: ${list}`,
            [],
            startTime,
            alumnosExcel.length
          );
        }
      }

      // Mapear a entidades Alumno
      const alumnos = alumnosValidos.map(alumnoExcel => 
        this.importMapper.mapToAlumno(alumnoExcel, turnoId)
      );

      // FLUJO CORRECTO: ALUMNO → USUARIO → ESTADO
      const alumnosGuardados: any[] = [];
      let usuariosCreados = 0;
      
      // Usar transacción para garantizar consistencia
      await this.dataSource.transaction(async (manager) => {
        for (let i = 0; i < alumnos.length; i++) {
          const alumnoData = alumnos[i];
          const datosOriginales = alumnosValidos[i]; // Mantener referencia a datos originales
          
        try {
          // PASO 1: Crear ALUMNO
            const alumnoGuardado = await manager.save('ALUMNO', alumnoData);
          
          // PASO 2: Crear USUARIO para este alumno
          if (crearUsuarios) {
              // Crear usuario directamente con los campos necesarios
              const usuario = new (await import('../../../usuario/usuario.entity')).Usuario();
              
              const nombreUsuario = this.generarNombreUsuario(datosOriginales);
              
              let nombreUsuarioUnico = await this.generarNombreUsuarioUnico(nombreUsuario, datosOriginales);
              
              // VERIFICACIÓN DENTRO DE LA TRANSACCIÓN para evitar condición de carrera
              let usuarioExistente = await manager.findOne('USUARIO', { 
                where: { nombre_usuario: nombreUsuarioUnico } 
              });
              
              // Si existe, generar otro nombre hasta encontrar uno disponible
              let intentos = 0;
              let contadorNumeracion = 1;
              let nombreBase = nombreUsuario;
              
              while (usuarioExistente && intentos < 5) {
                
                // Generar nombre con numeración incremental
                nombreUsuarioUnico = `${nombreBase}${contadorNumeracion}`;
                
                // Verificar si este nombre está disponible
                usuarioExistente = await manager.findOne('USUARIO', { 
                  where: { nombre_usuario: nombreUsuarioUnico } 
                });
                
                contadorNumeracion++;
                intentos++;
                
                if (!usuarioExistente) {
                  break;
                }
              }
              
              if (usuarioExistente) {
                // Si después de 5 intentos no se encuentra nombre único, usar timestamp
                nombreUsuarioUnico = `${nombreBase}${Date.now().toString().slice(-4)}`;
                
                // Verificar una vez más
                usuarioExistente = await manager.findOne('USUARIO', { 
                  where: { nombre_usuario: nombreUsuarioUnico } 
                });
                
                if (usuarioExistente) {
                  throw new Error(`No se pudo generar nombre de usuario único después de ${intentos} intentos`);
                }
              }
              
              
            usuario.nombre_usuario = nombreUsuarioUnico;
            // Generar contraseña por defecto: primerNombre + primerApellido + año (minúsculas)
            const firstName = (alumnoGuardado.nombre || '').trim().split(' ')[0] || '';
            const firstLast = (alumnoGuardado.apellido || '').trim().split(' ')[0] || '';
            const year = new Date().getFullYear();
            const defaultPlainPassword = `${firstName.toLowerCase()}${firstLast.toLowerCase()}${year}`;
            usuario.password_user = await this.hashPassword(defaultPlainPassword);
            usuario.rol_usuario = 'ALUMNO' as any;
            usuario.profile_image = 'uploads/profiles/no-image.png';
            
            const usuarioGuardado = await manager.save('USUARIO', usuario);
            
            // Guardar credenciales en archivo
            if (alumnoGuardado.codigo && alumnoGuardado.nombre && alumnoGuardado.apellido) {
              this.guardarCredencialesEnArchivo(alumnoGuardado.codigo, nombreUsuarioUnico, alumnoGuardado.nombre, alumnoGuardado.apellido);
            }
            
            // Asociar usuario con alumno
            alumnoGuardado.usuario = usuarioGuardado;
              await manager.save('ALUMNO', alumnoGuardado);
              
              usuariosCreados++;
          }
          
          // PASO 3: Crear ESTADO ACTIVO
            if (alumnoGuardado.id_alumno) {
              await this.crearEstadoAlumnoConManager(manager, alumnoGuardado.id_alumno);
            } else {
              throw new Error(`No se pudo obtener ID del alumno creado: ${alumnoGuardado.nombre}`);
            }
          
          alumnosGuardados.push(alumnoGuardado);
          
        } catch (error) {
            throw error; // Revertir transacción si hay error
        }
      }
      });

      const endTime = Date.now();
      const tiempoProcesamiento = Math.round((endTime - startTime) / 1000);

      // Log del resumen completo

      // Generar respuesta exitosa
      return this.generarRespuestaExitosa(
        alumnosGuardados,
        usuariosCreados,
        tiempoProcesamiento,
        alumnosExcel.length,
        0 // No hay duplicados
      );

    } catch (error) {
      return this.generarRespuestaErrorServidor(
        error.message || 'Error interno del servidor',
        error,
        startTime
      );
    }
  }

  /**
   * Genera nombre de usuario único para el alumno
   */
  private generarNombreUsuario(alumno: AlumnoExcelData): string {
    const nombre = (alumno.nombre || '').toString().trim();
    const apellido = (alumno.apellidoPaterno || alumno.apellidoMaterno || '').toString().trim();
    
    
    if (nombre && apellido) {
      // Tomar SOLO el primer nombre y primer apellido, SIN ESPACIOS
      const primerNombre = nombre.split(' ')[0];
      const primerApellido = apellido.split(' ')[0];
      
      
      const resultado = `${primerNombre.toUpperCase()}.${primerApellido.toUpperCase()}`;
      
      return resultado;
    }
    
    const resultado = `${nombre.toUpperCase()}`;
    return resultado;
  }

  /**
   * Genera un nombre de usuario único con numeración secuencial
   */
  private async generarNombreUsuarioUnico(nombreBase: string, alumnoData: AlumnoExcelData): Promise<string> {
    let nombreUsuario = nombreBase;
    let contador = 1;
    let intentoAlternativo = 1;
    
    
    // Verificar si ya existe un usuario con ese nombre
    let usuarioExistente: any = await this.usuarioRepository.findByUsername(nombreUsuario);
    
    // Si existe, intentar con nombres alternativos primero
    while (usuarioExistente && intentoAlternativo <= 3) {
      
      // Intentar con nombre alternativo
      nombreUsuario = this.generarNombreUsuarioAlternativo(alumnoData, intentoAlternativo);
      
      usuarioExistente = await this.usuarioRepository.findByUsername(nombreUsuario);
      intentoAlternativo++;
      
      if (!usuarioExistente) {
        return nombreUsuario;
      }
    }
    
    // Si los nombres alternativos también están ocupados, usar numeración
    
    // IMPORTANTE: Reinicializar la verificación para la numeración
    usuarioExistente = true; // Forzar entrada al bucle
    contador = 1;
    
    // NUNCA devolver el nombre base, siempre generar uno único
    while (usuarioExistente) {
      nombreUsuario = `${nombreBase}${contador}`;
      
      usuarioExistente = await this.usuarioRepository.findByUsername(nombreUsuario);
      contador++;
      
      // Evitar bucle infinito (máximo 10 intentos)
      if (contador > 10) {
        // Usar timestamp solo como último recurso
        nombreUsuario = `${nombreBase}${Date.now().toString().slice(-4)}`;
        break;
      }
    }
    
    if (contador > 1) {
    }
    
    return nombreUsuario;
  }

  /**
   * Genera nombre de usuario alternativo usando nombres/apellidos adicionales
   */
  private generarNombreUsuarioAlternativo(alumno: AlumnoExcelData, intento: number = 1): string {
    const nombre = (alumno.nombre || '').toString().trim();
    const apellido = (alumno.apellidoPaterno || alumno.apellidoMaterno || '').toString().trim();
    
    
    if (nombre && apellido) {
      const nombres = nombre.split(' ');
      const apellidos = apellido.split(' ');
      
      
      switch (intento) {
        case 1:
          // Primer intento: primer nombre + segundo apellido (si existe)
          if (apellidos.length > 1) {
            const resultado = `${nombres[0].toUpperCase()}.${apellidos[1].toUpperCase()}`;
            return resultado;
          }
          // Si no hay segundo apellido, usar segundo nombre + primer apellido
          if (nombres.length > 1) {
            const resultado = `${nombres[1].toUpperCase()}.${apellidos[0].toUpperCase()}`;
            return resultado;
          }
          break;
        
        case 2:
          // Segundo intento: segundo nombre + segundo apellido (si ambos existen)
          if (nombres.length > 1 && apellidos.length > 1) {
            const resultado = `${nombres[1].toUpperCase()}.${apellidos[1].toUpperCase()}`;
            return resultado;
          }
          // Si no, usar tercer nombre o apellido
          if (nombres.length > 2) {
            const resultado = `${nombres[2].toUpperCase()}.${apellidos[0].toUpperCase()}`;
            return resultado;
          }
          if (apellidos.length > 2) {
            const resultado = `${nombres[0].toUpperCase()}.${apellidos[2].toUpperCase()}`;
            return resultado;
          }
          break;
        
        case 3:
          // Tercer intento: combinaciones más específicas
          if (nombres.length > 2 && apellidos.length > 1) {
            const resultado = `${nombres[2].toUpperCase()}.${apellidos[1].toUpperCase()}`;
            return resultado;
          }
          if (nombres.length > 1 && apellidos.length > 2) {
            const resultado = `${nombres[1].toUpperCase()}.${apellidos[2].toUpperCase()}`;
            return resultado;
          }
          break;
      }
    }
    
    // Si no se puede generar alternativa, crear una combinación única
    
    // Usar el primer nombre + timestamp para garantizar unicidad
    const primerNombre = nombre.split(' ')[0];
    const timestamp = Date.now().toString().slice(-4);
    const resultado = `${primerNombre.toUpperCase()}.${timestamp}`;
    
    return resultado;
  }

  /**
   * Crea un estado ACTIVO para un alumno usando el manager de transacción
   */
  private async crearEstadoAlumnoConManager(manager: any, idAlumno: string): Promise<void> {
    try {
      const estadoAlumno = new EstadoAlumno();
      estadoAlumno.estado = 'activo';
      estadoAlumno.observacion = 'Alumno registrado por importación de Excel';
      estadoAlumno.id_alumno = idAlumno;
      estadoAlumno.fecha_actualizacion = new Date();

      await manager.save('ESTADO_ALUMNO', estadoAlumno);
      
    } catch (error) {
      throw error; // Revertir transacción si hay error
    }
  }

  /**
   * Crea un estado ACTIVO para un alumno
   */
  private async crearEstadoAlumno(idAlumno: string): Promise<void> {
    try {
      const estadoAlumno = new EstadoAlumno();
      estadoAlumno.estado = 'activo';
      estadoAlumno.observacion = 'Alumno registrado por importación de Excel';
      estadoAlumno.id_alumno = idAlumno;
      estadoAlumno.fecha_actualizacion = new Date();

      const estadoRepo = this.dataSource.getRepository(EstadoAlumno);
      await estadoRepo.save(estadoAlumno);
      
    } catch (error) {
      // No lanzar error para no detener el proceso de importación
    }
  }

  /**
   * Hashea una contraseña usando bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private generarRespuestaError(
    message: string,
    alumnos: any[],
    startTime: number,
    totalAlumnosExcel: number
  ): ImportAlumnosExcelResponse {
    const endTime = Date.now();
    const tiempoProcesamiento = Math.round((endTime - startTime) / 1000);

    const estadisticas = {
      total_importados: 0,
      exitosos: 0,
      con_errores: totalAlumnosExcel,
      usuarios_creados: 0,
      tiempo_procesamiento: tiempoProcesamiento
    };

    return {
      success: false,
      message: message,
      total: 0,
      data: [],
      estadisticas
    };
  }

  private generarRespuestaErrorServidor(
    message: string,
    error: any,
    startTime: number
  ): ImportAlumnosExcelResponse {
    const endTime = Date.now();
    const tiempoProcesamiento = Math.round((endTime - startTime) / 1000);

    const estadisticas = {
      total_importados: 0,
      exitosos: 0,
      con_errores: 0,
      usuarios_creados: 0,
      tiempo_procesamiento: tiempoProcesamiento
    };

    return {
      success: false,
      message: message,
      total: 0,
      data: [],
      error: error.message || 'Error interno del servidor',
      estadisticas
    };
  }

  private generarRespuestaExitosa(
    alumnosGuardados: any[],
    usuariosCreados: number,
    tiempoProcesamiento: number,
    totalAlumnosExcel: number,
    duplicadosEncontrados: number
  ): ImportAlumnosExcelResponse {
    const estadisticas = {
      total_importados: alumnosGuardados.length,
      exitosos: alumnosGuardados.length,
      con_errores: totalAlumnosExcel - alumnosGuardados.length - duplicadosEncontrados,
      usuarios_creados: usuariosCreados,
      tiempo_procesamiento: tiempoProcesamiento
    };

    // Generar mensaje de confirmación claro
    const mensajeConfirmacion = this.generarMensajeConfirmacion(estadisticas, usuariosCreados > 0);

    // Mapear alumnos al formato esperado por el frontend
    const data = alumnosGuardados.map(alumno => ({
      id_alumno: alumno.id_alumno,
      codigo: alumno.codigo,
      dni_alumno: alumno.dni_alumno,
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      fecha_nacimiento: alumno.fecha_nacimiento ? alumno.fecha_nacimiento.toISOString().split('T')[0] : null,
      direccion: alumno.direccion,
      nivel: alumno.nivel,
      grado: alumno.grado,
      seccion: alumno.seccion,
      turno_id: alumno.id_turno,
      qr_code: alumno.codigo_qr,
      usuario: {
        id_user: alumno.usuario?.id_user || alumno.id_alumno,
        username: alumno.usuario?.nombre_usuario || `${alumno.nombre}.${alumno.apellido}`.toLowerCase(),
        role: alumno.usuario?.rol_usuario || 'ALUMNO'
      },
      estado: 'REGISTRADO'
    }));

    return {
      success: true,
      message: mensajeConfirmacion,
      total: estadisticas.total_importados,
      data,
      estadisticas
    };
  }

  /**
   * Genera mensaje de confirmación detallado y claro
   */
  private generarMensajeConfirmacion(estadisticas: any, crearUsuarios: boolean): string {
    const partes: string[] = [];
    
    // Resultado principal
    if (estadisticas.total_importados > 0) {
      partes.push(`✅ IMPORTACIÓN EXITOSA: ${estadisticas.total_importados} alumnos registrados`);
    } else {
      partes.push(`⚠️ NO SE REGISTRARON NUEVOS ALUMNOS`);
    }
    
    // Detalles de usuarios
    if (crearUsuarios && estadisticas.usuarios_creados > 0) {
      partes.push(`${estadisticas.usuarios_creados} usuarios creados`);
    }
    
    // Tiempo de proceso
    partes.push(`Procesado en ${estadisticas.tiempo_procesamiento}s`);
    
    return partes.join(' | ');
  }

  private guardarCredencialesEnArchivo(codigo: string, username: string, nombre: string, apellido: string): void {
    try {
      const archivoPath = path.join(process.cwd(), 'password-alumnos.txt');
      
      // Generar contraseña por defecto
      const firstName = nombre.trim().split(' ')[0];
      const firstLast = apellido.trim().split(' ')[0];
      const year = new Date().getFullYear();
      const password = `${firstName.toLowerCase()}${firstLast.toLowerCase()}${year}`;
      
      // Crear línea de credenciales
      const lineaCredenciales = `${codigo}|${username}|${password}|${nombre} ${apellido}\n`;
      
      // Verificar si el archivo existe
      if (!fs.existsSync(archivoPath)) {
        // Si no existe, crear con encabezado
        const encabezado = '# Archivo para almacenar contraseñas de alumnos por defecto\n# Formato: codigo_alumno|username|contraseña_por_defecto|nombre_completo\n# Ejemplo: 1234567890|JUAN.PEREZ|juanperez2025|Juan Pérez\n\n';
        fs.writeFileSync(archivoPath, encabezado);
      }
      
      // Agregar las credenciales al final del archivo
      fs.appendFileSync(archivoPath, lineaCredenciales);
      
    } catch (error) {
      // No lanzar error para no detener el proceso de creación del alumno
    }
  }
}
