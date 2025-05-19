interface AlumnoExcelData {
  grado?: string | number;
  seccion?: string;
  numeroDocumento?: string;
  dni?: string;
  codigo?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  nombre?: string;
  fechaNacimiento?: string | Date;
  nivel?: string;
  [key: string]: any;
}

import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { AlumnoService } from '../../../../domain/services/alumno.service';
import { Alumno } from '../../../orm/entities/alumno.entity';
import { CreateAlumnoUseCase } from '../../../../domain/ports/inbound/cases/create-alumno.usecase';
import { RegisterAlumnoDto } from 'src/auth/dto/alumno/registers/alumno-create.dto';
import { ValidarAlumnoUseCase } from '../../../../domain/ports/inbound/cases/validate-alumno-qr.usecases';
import { GetAlumnoByCodigoUseCase } from '../../../../domain/ports/inbound/cases/get-personal-alumno.usecase';
import { UpdateAlumnoDto } from 'src/entities/alumno/domain/dtos/UpdateAlumno.dto';
import { ActualizarAlumnoCase } from 'src/entities/alumno/domain/ports/inbound/cases/update-alumno.usecase';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';



@Controller('alumnos')
// @UseGuards(AuthGuard('jwt'), RolesGuard)
export class AlumnoController {
  constructor(
    private readonly alumnoService: AlumnoService,
    private readonly useCaseAlumno: CreateAlumnoUseCase,
    private readonly useCaseValidateAlumno: ValidarAlumnoUseCase,
    private readonly getPersonalAlumno: GetAlumnoByCodigoUseCase,
    private readonly updateAlumnoCase: ActualizarAlumnoCase,
  ) { }


  
  @Put('actualizar/:codigo')
  @ApiOperation({ summary: 'Actualiza un alumno por codigo de estudiante', 
    description: 
      `
      1. Recibe el codigo de entrada de tipo string, el codigo solo es valido si tiene una longitud de 14 caracteres.
      2. Luego de haber validado se necesita validar el body en la cual sera de tipo UpdateAlumnoDto que en ella tiene los siguientes campos:
        {  }
      ` 
    })
  @ApiParam({ name: 'codigo', type: 'string',  description: 'Recibe un codigo de estudiante de entrada para actualizar alumno'})
  @ApiBody({ type: UpdateAlumnoDto, description: 'Este es el DTO de entrada que se debe respetar para procesar la actualizacion de alumno' })
  @ApiResponse({ status: 200, description: 'Alumno Actualizado correctamente', type: Alumno })
  async updateAlumnoByCode(
    @Param('codigo') codigo: string, //ApiParam
    @Body() updateAlumnoDto: UpdateAlumnoDto //ApiBody
  ): Promise<Alumno>  {
    return this.updateAlumnoCase.execute(codigo, updateAlumnoDto);
  }


  @Get('codigo/:codigo')
  async findAlumnoByCode(
    @Param('codigo') codigo: string
  ): Promise<Partial<Alumno>> {
    return this.getPersonalAlumno.execute(codigo);
  }

  @Get()
  async findAll(): Promise<Alumno[]> {
    return this.alumnoService.findAll();
  }

  @Get('validate/:codigoQR')
  async validateAlumnoQr(@Param('codigoQR') codigoQr: string) {
    return this.useCaseValidateAlumno.execute(codigoQr);
  }

  @Post('registrar')

  create(@Body() createAlumnoDto: RegisterAlumnoDto) {
    return this.useCaseAlumno.execute(createAlumnoDto);
  }



  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file'))
  async importarExcel(
    @UploadedFile() file: Express.Multer.File,
    @Query('turnoId') turnoId: string
  ) {
    // Validar que se recibió un archivo
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    // Validar que se proporcionó un ID de turno
    if (!turnoId) {
      throw new BadRequestException('Se requiere el ID del turno para la importación');
    }

    try {
      // Leer el archivo Excel
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      
      // Obtener la primera hoja
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convertir la hoja a formato JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        defval: '',
        raw: false, // Mantener formatos de fecha y número como strings
        header: 1 // Usar la primera fila como encabezados
      }) as any[][];

      // Analizar estructura del Excel (basado en lo que vimos en RELACION DE ESTUDIANTES.xlsx)
      let startRow = -1;
      
      // Buscar la fila que contiene las cabeceras
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && Array.isArray(row) && 
            row.some(cell => typeof cell === 'string' && cell.includes('GRADO')) && 
            row.some(cell => typeof cell === 'string' && cell.includes('SECCIÓN'))) {
          // Guardamos el índice donde empiezan las cabeceras principales
          startRow = i;
          break;
        }
      }

      if (startRow === -1 || startRow + 1 >= rawData.length) {
        throw new BadRequestException('Formato de archivo no válido: No se encontraron las cabeceras esperadas');
      }

      // Combinar cabeceras de dos filas si es necesario (como en el ejemplo)
      const headerRow1 = rawData[startRow];
      const headerRow2 = rawData[startRow + 1];
      
      // Mapeo de columnas críticas
      const columnMap: Record<string, string> = {
        'GRADO': 'grado',
        'SECCIÓN': 'seccion',
        'NÚMERO DE DOCUMENTO': 'numeroDocumento',
        'CÓDIGO DEL ESTUDIANTE': 'codigo',
        'APELLIDO PATERNO': 'apellidoPaterno',
        'APELLIDO MATERNO': 'apellidoMaterno',
        'NOMBRES': 'nombre',
        'FECHA DE NACIMIENTO': 'fechaNacimiento',
        'NIVEL': 'nivel'
      };

      // Objeto para almacenar los índices de columnas
      const columnas: Record<string, number> = {};

      // Detectar índices de columnas relevantes (combinando las dos filas de headers)
      for (let i = 0; i < headerRow1.length; i++) {
        const header1 = headerRow1[i]?.toString().trim() || '';
        const header2 = headerRow2 ? headerRow2[i]?.toString().trim() || '' : '';
        
        const fullHeader = header1 || header2;
        
        // Buscar coincidencias parciales en las cabeceras
        for (const [key, value] of Object.entries(columnMap)) {
          if (fullHeader.includes(key)) {
            columnas[value] = i;
            break;
          }
        }
      }

      // Verificar que se encontraron columnas mínimas requeridas
      const requiredColumns = ['grado', 'seccion'];
      const missingColumns = requiredColumns.filter(col => columnas[col] === undefined);
      
      if (missingColumns.length > 0) {
        throw new BadRequestException(`Faltan columnas requeridas: ${missingColumns.join(', ')}`);
      }

      // Procesar los datos para obtener los alumnos
      const alumnos: AlumnoExcelData[] = [];
      
      // Empezar desde la fila después de las cabeceras
      for (let i = startRow + 2; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || !Array.isArray(row) || row.every(cell => !cell)) {
          continue; // Saltar filas vacías
        }

        // Extraer datos de acuerdo a los índices de columnas encontrados
        const alumno: AlumnoExcelData = {};
        
        // Establecer valores para las propiedades según las columnas detectadas
        for (const [prop, index] of Object.entries(columnas)) {
          if (index !== undefined && index >= 0 && index < row.length) {
            alumno[prop] = row[index];
          }
        }

        // Solo agregar alumnos que tengan al menos número de documento o grado/sección
        if (
          (alumno.numeroDocumento || alumno.dni) || 
          (alumno.grado && alumno.seccion)
        ) {
          alumnos.push(alumno);
        }
      }

      // Si no hay alumnos, lanzar error
      if (alumnos.length === 0) {
        throw new BadRequestException('No se encontraron datos de alumnos en el archivo');
      }

      // Pasar los datos al servicio para crear los alumnos y sus usuarios
      const alumnosInsertados = await this.alumnoService.importarDesdeExcel(alumnos, turnoId);
      
      return {
        message: 'Importación exitosa',
        total: alumnosInsertados.length,
        alumnos: alumnosInsertados,
      };
    } catch (error) {
      // Si el error ya es de tipo BadRequestException, simplemente lo lanzamos
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Cualquier otro error lo manejamos aquí
      throw new BadRequestException(`Error al procesar el archivo: ${error.message}`);
    }
  }


}
