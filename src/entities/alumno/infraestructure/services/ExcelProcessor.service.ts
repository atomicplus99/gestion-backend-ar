import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { AlumnoExcelData } from '../../domain/dtos/ImportAlumnosExcel.dto';

@Injectable()
export class ExcelProcessorService {
  processExcelFile(file: Express.Multer.File): AlumnoExcelData[] {
    try {
      
      // Leer el archivo Excel
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      
      // Obtener la primera hoja
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convertir la hoja a formato JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        defval: '',
        raw: false,
        header: 1
      }) as any[][];

      
      // Analizar estructura del Excel
      const startRow = this.findHeaderRow(rawData);
      
      if (startRow === -1 || startRow + 1 >= rawData.length) {
        throw new BadRequestException('Formato de archivo no válido: No se encontraron las cabeceras esperadas');
      }

      // Obtener mapeo de columnas
      const columnas = this.mapColumns(rawData[startRow], rawData[startRow + 1]);
      
      // Verificar columnas requeridas
      this.validateRequiredColumns(columnas);
      
      // Procesar datos
      return this.extractAlumnosData(rawData, startRow + 2, columnas);
      
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al procesar el archivo: ${error.message}`);
    }
  }

  private findHeaderRow(rawData: any[][]): number {
    
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      
      if (row && Array.isArray(row)) {
        // Buscar grados (PRIMERO, SEGUNDO, TERCERO, CUARTO, QUINTO)
        const hasGrado = row.some(cell => 
          typeof cell === 'string' && 
          (cell.includes('PRIMERO') || cell.includes('SEGUNDO') || cell.includes('TERCERO') || 
           cell.includes('CUARTO') || cell.includes('QUINTO') || cell.includes('GRADO'))
        );
        
        // Buscar secciones (A, B, C, D, E, F, G, H, I, J) o la palabra SECCIÓN
        const hasSeccion = row.some(cell => 
          typeof cell === 'string' && 
          (cell.trim() === 'A' || cell.trim() === 'B' || cell.trim() === 'C' || 
           cell.trim() === 'D' || cell.trim() === 'E' || cell.trim() === 'F' ||
           cell.trim() === 'G' || cell.trim() === 'H' || cell.trim() === 'I' ||
           cell.trim() === 'J' || cell.includes('SECCIÓN') || cell.includes('SECCION'))
        );
        
        
        if (hasGrado && hasSeccion) {
          return i;
        }
      }
    }
    
    return -1;
  }

  private mapColumns(headerRow1: any[], headerRow2: any[]): Record<string, number> {
    const columnMap: Record<string, string> = {
      'GRADO': 'grado',
      'SECCIÓN': 'seccion',
      'SECCION': 'seccion', // Sin tilde
      'NÚMERO DE DOCUMENTO': 'numeroDocumento',
      'NUMERO DE DOCUMENTO': 'numeroDocumento', // Sin tilde
      'DNI': 'dni',
      'CÓDIGO DEL ESTUDIANTE': 'codigo',
      'CODIGO DEL ESTUDIANTE': 'codigo', // Sin tilde
      'APELLIDO PATERNO': 'apellidoPaterno',
      'APELLIDO MATERNO': 'apellidoMaterno',
      'NOMBRES': 'nombre',
      'FECHA DE NACIMIENTO': 'fechaNacimiento',
      'NIVEL': 'nivel',
      'SEXO': 'sexo',
      'EDAD': 'edad',
      'ESTADO DE MATRICULA': 'estadoMatricula',
      'TIPO DE VACANTE': 'tipoVacante',
      'VALIDADO CON RENIEC': 'validadoReniec'
    };

    const columnas: Record<string, number> = {};

    for (let i = 0; i < headerRow1.length; i++) {
      const header1 = headerRow1[i]?.toString().trim() || '';
      const header2 = headerRow2 ? headerRow2[i]?.toString().trim() || '' : '';
      
      const fullHeader = header1 || header2;
      
      for (const [key, value] of Object.entries(columnMap)) {
        if (fullHeader.includes(key)) {
          columnas[value] = i;
          break;
        }
      }
    }

    return columnas;
  }

  private validateRequiredColumns(columnas: Record<string, number>): void {
    const requiredColumns = ['grado', 'seccion'];
    const missingColumns = requiredColumns.filter(col => columnas[col] === undefined);
    
    if (missingColumns.length > 0) {
      throw new BadRequestException(`Faltan columnas requeridas: ${missingColumns.join(', ')}`);
    }
  }

  private extractAlumnosData(
    rawData: any[][], 
    startRow: number, 
    columnas: Record<string, number>
  ): AlumnoExcelData[] {
    const alumnos: AlumnoExcelData[] = [];
    
    for (let i = startRow; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || !Array.isArray(row) || row.every(cell => !cell)) {
        continue;
      }

      const alumno: AlumnoExcelData = {};
      
      for (const [prop, index] of Object.entries(columnas)) {
        if (index !== undefined && index >= 0 && index < row.length) {
          alumno[prop] = row[index];
        }
      }

      // Solo agregar alumnos que tengan datos válidos
      if (this.isValidAlumnoRow(alumno)) {
        alumnos.push(alumno);
      }
    }

    if (alumnos.length === 0) {
      throw new BadRequestException('No se encontraron datos de alumnos en el archivo');
    }

    return alumnos;
  }

  private isValidAlumnoRow(alumno: AlumnoExcelData): boolean {
    return Boolean(
      (alumno.numeroDocumento || alumno.dni) || 
      (alumno.grado && alumno.seccion)
    );
  }
}
