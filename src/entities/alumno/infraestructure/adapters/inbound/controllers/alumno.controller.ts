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
  BadRequestException,
  Logger
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
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { AlumnoUpdateResponseDto, ErrorResponseDto, ValidationErrorResponseDto } from 'src/entities/alumno/domain/dtos/response/SuccessResponse.dto';
import { AlumnoSearchResponseDto } from 'src/entities/alumno/domain/dtos/response/AlumnoSearchResponse.dto';
import { GetAlumnosUseCase } from 'src/entities/alumno/domain/ports/inbound/cases/get-alumnos.usecase';
import { ImportAlumnosExcelDto } from '../../../../domain/dtos/ImportAlumnosExcel.dto';
import { ExcelProcessorService } from '../../../../infraestructure/services/ExcelProcessor.service';
import { ImportAlumnosExcelService } from '../../../../infraestructure/services/ImportAlumnosExcel.service';

@Controller('alumnos')
export class AlumnoController {
  private readonly logger = new Logger(AlumnoController.name);

  constructor(
    private readonly alumnoService: AlumnoService,
    private readonly useCaseAlumno: CreateAlumnoUseCase,
    private readonly useCaseValidateAlumno: ValidarAlumnoUseCase,
    private readonly getPersonalAlumno: GetAlumnoByCodigoUseCase,
    private readonly updateAlumnoCase: ActualizarAlumnoCase,
    private readonly getAlumnosUseCase: GetAlumnosUseCase,
    private readonly excelProcessorService: ExcelProcessorService,
    private readonly importAlumnosExcelService: ImportAlumnosExcelService
  ) { }

  @Put('actualizar/:codigo')
  @ApiSecurity({describe: ['Actualizado en la fecha: 18/05/2025']})
  @ApiOperation({ 
    summary: 'Actualiza un alumno por codigo de estudiante', 
    description: 
      `
      1. Recibe el codigo de entrada de tipo string, el codigo solo es valido si tiene una longitud de 14 caracteres.
      2. Luego de haber validado se necesita validar el body en la cual sera de tipo UpdateAlumnoDto que contiene los datos del Alumno con los respectivos
        indicaciones para ser procesado.
      3. Se ejecuta el metodo del updateAlumnoCase (caso de uso) enviando los datos de entrada.
      4. Se ejecuta validaciones si el codigo existe y se envia al mapper para actualizar los datos del alumno.
      5. Si no existe conflicto hasta este punto se habra actualizado el alumno correctamente caso contrario devolvera un error de status.
      ` 
    })
  @ApiParam({ name: 'codigo', type: 'string',  description: 'Recibe un codigo de estudiante de entrada para actualizar alumno'})
  @ApiBody({ type: UpdateAlumnoDto, description: 'Este es el DTO de entrada que se debe respetar para procesar la actualizacion de alumno' })
  @ApiResponse({ 
    status: 200, 
    description: 'Alumno Actualizado correctamente', 
    type: AlumnoUpdateResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Error de validación en los datos', 
    type: ValidationErrorResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Alumno no encontrado', 
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Error interno del servidor', 
    type: ErrorResponseDto 
  })
  async updateAlumnoByCode(
    @Param('codigo') codigo: string,
    @Body() updateAlumnoDto: UpdateAlumnoDto
  ): Promise<AlumnoUpdateResponseDto>  {
    this.logger.log(`🔄 [Controller] Iniciando actualización de alumno con código: ${codigo}`);
    try {
      const alumnoActualizado = await this.updateAlumnoCase.execute(codigo, updateAlumnoDto);
      this.logger.log(`✅ [Controller] Alumno actualizado exitosamente`);
      return alumnoActualizado;
    } catch (error) {
      this.logger.error(`❌ [Controller] Error en actualización: ${error.message}`);
      throw error;
    }
  }

  @Get('codigo/:codigo')
  @ApiSecurity({describe: ['Actualizado en la fecha: 18/05/2025']})
  @ApiOperation({ 
    summary: 'Buscar alumno por código',
    description: 
      `
      1. Se ingresa un codigo de estudiante para hacer la solicitud.
      2. Retorna ok si existe ese codigo de estudiante devolviendo la informacion de la misma.
      3. Incluye información completa del alumno, turno, usuario asociado y estado actual (opcional).
      ` 
  })
  @ApiParam({ name: "codigo", type: "string", description: "Se ingresa el codigo del estudiante para realizar el proceso de obtener estudiante" })
  @ApiResponse({
    status: 200,
    description: "Retorna el alumno según código de estudiante con información completa incluyendo estado", 
    type: AlumnoSearchResponseDto
  })
  @ApiResponse({
    status: 400,
    description: "Código inválido (debe tener 14 dígitos)",
    type: ErrorResponseDto
  })
  @ApiResponse({
    status: 404,
    description: "No se encontró ningún alumno con el código especificado",
    type: ErrorResponseDto
  })
  async findAlumnoByCode(
    @Param('codigo') codigo: string
  ): Promise<AlumnoSearchResponseDto> {
    this.logger.log(`🔍 [Controller] Iniciando búsqueda de alumno con código: ${codigo}`);
    this.logger.log(`📊 [Controller] Tipo de código recibido: ${typeof codigo}, Longitud: ${codigo?.length || 0}`);
    
    try {
      this.logger.log(`📞 [Controller] Llamando al caso de uso para buscar alumno`);
      const resultado = await this.getPersonalAlumno.execute(codigo);
      
      this.logger.log(`📊 [Controller] Resultado del caso de uso: ${resultado ? 'Encontrado' : 'No encontrado'}`);
      
      if (resultado) {
        this.logger.log(`✅ [Controller] Alumno encontrado exitosamente:`);
        this.logger.log(`   - ID: ${resultado.id_alumno}`);
        this.logger.log(`   - Código: ${resultado.codigo}`);
        this.logger.log(`   - Nombre: ${resultado.nombre} ${resultado.apellido}`);
        this.logger.log(`   - Turno: ${resultado.turno ? `ID: ${resultado.turno.id_turno}` : 'No asignado'}`);
        this.logger.log(`   - Usuario: ${resultado.usuario ? `ID: ${resultado.usuario.id_user}` : 'No asignado'}`);
        this.logger.log(`   - Estado: ${resultado.estado_actual ? resultado.estado_actual.estado : 'No asignado'}`);
      }
      
      return resultado;
    } catch (error) {
      this.logger.error(`❌ [Controller] Error en búsqueda de alumno: ${error.message}`);
      this.logger.error(`Stack trace: ${error.stack}`);
      throw error;
    }
  }

  @Get()
  @ApiSecurity({describe: ['Actualizado en la fecha : 18/05/2025']})
  @ApiResponse({description: "Retorna la informacion de los estudiantes"})
  @ApiOperation({description:  `1. Retorna todos los alumnos registrados hasta al momento en la base de datos.` })
  async findAllAlumnos(): Promise<Alumno[]> {
    this.logger.log(`🔍 [Controller] Buscando todos los alumnos`);
    try {
      const alumnos = await this.getAlumnosUseCase.execute();
      this.logger.log(`✅ [Controller] Encontrados ${alumnos.length} alumnos`);
      return alumnos;
    } catch (error) {
      this.logger.error(`❌ [Controller] Error al buscar todos los alumnos: ${error.message}`);
      throw error;
    }
  }

  @Get('validate/:codigoQR')
  async validateAlumnoQr(@Param('codigoQR') codigoQr: string) {
    this.logger.log(`🔍 [Controller] Validando código QR: ${codigoQr}`);
    try {
      const resultado = await this.useCaseValidateAlumno.execute(codigoQr);
      this.logger.log(`✅ [Controller] Validación QR completada`);
      return resultado;
    } catch (error) {
      this.logger.error(`❌ [Controller] Error en validación QR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Registra un nuevo alumno en el sistema
   * @param createAlumnoDto Datos del alumno a registrar
   * @returns Alumno registrado
   */
  @Post('registrar')
  @ApiOperation({ summary: 'Registrar un nuevo alumno' })
  @ApiBody({ type: RegisterAlumnoDto, description: 'Datos del alumno a registrar' })
  @ApiResponse({ status: 201, description: 'Alumno registrado exitosamente', type: Alumno })
  @ApiResponse({ status: 400, description: 'Datos inválidos o código duplicado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async create(@Body() createAlumnoDto: RegisterAlumnoDto) {
    this.logger.log(`🚀 [Controller] Iniciando registro de nuevo alumno`);
    try {
      const resultado = await this.useCaseAlumno.execute(createAlumnoDto);
      this.logger.log(`✅ [Controller] Alumno registrado exitosamente`);
      return resultado;
    } catch (error) {
      this.logger.error(`❌ [Controller] Error al registrar alumno: ${error.message}`);
      throw error; // Re-lanzar el error para que se maneje en el nivel superior
    }
  }

  @Post('register-alumno-for-excel')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ 
    summary: 'Importar alumnos desde archivo Excel', 
    description: 'Importa múltiples alumnos desde un archivo Excel (.xlsx ÚNICAMENTE) con validaciones específicas para DNI y código de estudiante. El parámetro crear_usuarios es opcional (por defecto: true)' 
  })
  @ApiResponse({ status: 200, description: 'Importación exitosa con estadísticas detalladas' })
  @ApiResponse({ status: 400, description: 'Error en el archivo o parámetros' })
  async importarExcel(
    @UploadedFile() file: Express.Multer.File,
    @Query('turnoId') turnoId: string,
    @Query('crear_usuarios') crear_usuarios?: string // Hacer opcional
  ) {
    this.logger.log(`📁 [Controller] Iniciando importación de Excel`);
    
    // Validar que se recibió un archivo
    if (!file) {
      this.logger.error(`❌ [Controller] No se recibió ningún archivo`);
      throw new BadRequestException('No se recibió ningún archivo');
    }

    // Validar que el archivo sea específicamente .xlsx
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const allowedExtensions = ['.xlsx'];
    
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(fileExtension)) {
      this.logger.error(`❌ [Controller] Formato de archivo no válido: ${file.originalname} (${file.mimetype})`);
      throw new BadRequestException(
        `Formato de archivo no válido. Solo se permiten archivos .xlsx. ` +
        `Recibido: ${file.originalname} (${file.mimetype})`
      );
    }

    // Validar que se proporcionó un ID de turno
    if (!turnoId) {
      this.logger.error(`❌ [Controller] No se proporcionó ID de turno`);
      throw new BadRequestException('Se requiere el ID del turno para la importación');
    }

    // Hacer crear_usuarios opcional con valor por defecto
    let crearUsuarios = true; // Valor por defecto
    
    if (crear_usuarios !== undefined && crear_usuarios !== null) {
      // Si se proporciona el parámetro, validarlo
      if (typeof crear_usuarios === 'string') {
        crearUsuarios = crear_usuarios.toLowerCase() === 'true';
      } else {
        throw new BadRequestException('El parámetro crear_usuarios debe ser una cadena de texto (true/false)');
      }
    } else {
      // Si no se proporciona, usar valor por defecto y loguear
      this.logger.log(`ℹ️ [Controller] Parámetro crear_usuarios no especificado, usando valor por defecto: ${crearUsuarios}`);
    }

    try {
      const startTime = Date.now();
      
      // Procesar archivo Excel usando el servicio especializado
      this.logger.log(`📊 [Controller] Procesando archivo Excel`);
      const alumnos = this.excelProcessorService.processExcelFile(file);
      
      const endTime = Date.now();
      const tiempoProceso = Math.round((endTime - startTime) / 1000);
      this.logger.log(`⏱️ [Controller] Tiempo de procesamiento Excel: ${tiempoProceso}s`);
      
      // Ejecutar servicio de importación
      this.logger.log(`📥 [Controller] Importando ${alumnos.length} alumnos`);
      const resultado = await this.importAlumnosExcelService.importarAlumnos(
        alumnos,
        turnoId,
        crearUsuarios
      );
      
      this.logger.log(`✅ [Controller] Importación completada exitosamente`);
      return resultado;
      
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`❌ [Controller] Error al procesar el archivo: ${error.message}`);
      throw new BadRequestException(`Error al procesar el archivo: ${error.message}`);
    }
  }
}
