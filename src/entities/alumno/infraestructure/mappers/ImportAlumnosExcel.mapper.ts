import { Injectable } from '@nestjs/common';
import { AlumnoExcelData } from '../../domain/dtos/ImportAlumnosExcel.dto';
import { Alumno } from '../../infraestructure/orm/entities/alumno.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImportAlumnosExcelMapper {
  mapToAlumno(
    excelData: AlumnoExcelData,
    turnoId: string
  ): Partial<Alumno> {
    // Crear objeto parcial de Alumno
    const alumnoData: Partial<Alumno> = {
      codigo: this.mapCodigo(excelData),
      dni_alumno: this.mapDNI(excelData),
      nombre: this.mapNombre(excelData),
      apellido: this.mapApellido(excelData),
      fecha_nacimiento: this.mapFechaNacimiento(excelData),
      direccion: 'NO DEFINIDO',
      codigo_qr: uuidv4(),
      nivel: this.mapNivel(excelData),
      grado: this.mapGrado(excelData),
      seccion: this.mapSeccion(excelData),
      turno: { id_turno: turnoId } as any, // Usar la relación turno
    };
    
    return alumnoData;
  }

  private mapCodigo(data: AlumnoExcelData): string {
    if (data.codigo && this.isValidCodigo(data.codigo.toString())) {
      return data.codigo.toString();
    }
    return `A${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  private mapDNI(data: AlumnoExcelData): string {
    const dni = data.numeroDocumento || data.dni || '00000000';
    return dni.toString().substring(0, 8);
  }

  private mapNombre(data: AlumnoExcelData): string {
    return data.nombre?.toString().trim() || 'Sin Nombre';
  }

  private mapApellido(data: AlumnoExcelData): string {
    if (data.apellidoPaterno || data.apellidoMaterno) {
      return [
        data.apellidoPaterno?.toString().trim() || '',
        data.apellidoMaterno?.toString().trim() || ''
      ].filter(Boolean).join(' ');
    }
    return 'Sin Apellido';
  }

  private mapFechaNacimiento(data: AlumnoExcelData): Date {
    try {
      if (data.fechaNacimiento) {
        if (typeof data.fechaNacimiento === 'string') {
          const parts = data.fechaNacimiento.split('/');
          if (parts.length === 3) {
            // Formato dd/mm/yyyy
            return new Date(
              parseInt(parts[2]), 
              parseInt(parts[1]) - 1, 
              parseInt(parts[0])
            );
          } else {
            return new Date(data.fechaNacimiento);
          }
        } else if (data.fechaNacimiento instanceof Date) {
          return data.fechaNacimiento;
        }
      }
    } catch (error) {
      console.warn('Error al parsear fecha de nacimiento:', error);
    }
    return new Date();
  }

  private mapNivel(data: AlumnoExcelData): string {
    return data.nivel || 'Secundaria';
  }

  private mapGrado(data: AlumnoExcelData): number {
    if (data.grado !== undefined && data.grado !== null) {
      if (typeof data.grado === 'number') {
        return data.grado;
      } else if (typeof data.grado === 'string') {
        const gradoStr = data.grado.toString().toUpperCase();
        if (/PRIMER/i.test(gradoStr)) return 1;
        if (/SEGUND/i.test(gradoStr)) return 2;
        if (/TERCER/i.test(gradoStr)) return 3;
        if (/CUART/i.test(gradoStr)) return 4;
        if (/QUINT/i.test(gradoStr)) return 5;
        if (/SEXT/i.test(gradoStr)) return 6;
        
        const numMatch = gradoStr.match(/\d+/);
        if (numMatch) return parseInt(numMatch[0]);
      }
    }
    return 1; // Valor por defecto
  }

  private mapSeccion(data: AlumnoExcelData): string {
    if (data.seccion && typeof data.seccion === 'string' && data.seccion.trim().length > 0) {
      return data.seccion.trim().charAt(0).toUpperCase();
    }
    return 'A'; // Valor por defecto
  }

  private isValidCodigo(codigo: string): boolean {
    // Validar que el código tenga 14 dígitos según el frontend
    return /^\d{14}$/.test(codigo);
  }

  validateAlumnoData(data: AlumnoExcelData): boolean {
    // Validar DNI (8 dígitos)
    if (data.dni && data.dni.toString().length !== 8) {
      return false;
    }
    
    // Validar código (14 dígitos)
    if (data.codigo && !this.isValidCodigo(data.codigo.toString())) {
      return false;
    }
    
    // Validar que tenga al menos grado y sección
    if (!data.grado || !data.seccion) {
      return false;
    }
    
    return true;
  }
}
