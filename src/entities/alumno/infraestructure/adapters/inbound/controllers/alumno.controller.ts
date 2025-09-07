import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
  BadRequestException,
  NotFoundException,
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
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { AlumnoUpdateResponseDto, ErrorResponseDto, ValidationErrorResponseDto } from 'src/entities/alumno/domain/dtos/response/SuccessResponse.dto';
import { AlumnoSearchResponseDto } from 'src/entities/alumno/domain/dtos/response/AlumnoSearchResponse.dto';
import { GetAlumnosUseCase } from 'src/entities/alumno/domain/ports/inbound/cases/get-alumnos.usecase';
import { ImportAlumnosExcelDto } from '../../../../domain/dtos/ImportAlumnosExcel.dto';
import { ExcelProcessorService } from '../../../../infraestructure/services/ExcelProcessor.service';
import { ImportAlumnosExcelService } from '../../../../infraestructure/services/ImportAlumnosExcel.service';
import { AlumnoResponseDto, AlumnoConApoderadoResponseDto } from 'src/entities/alumno/domain/dtos/response/AlumnoResponse.dto';

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
    try {
      const alumnoActualizado = await this.updateAlumnoCase.execute(codigo, updateAlumnoDto);
      return alumnoActualizado;
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Actualizar alumno por ID', 
    description: 'Actualiza los datos de un alumno específico usando su ID único'
  })
  @ApiParam({ name: 'id', type: 'string', description: 'ID único del alumno' })
  @ApiBody({ type: UpdateAlumnoDto, description: 'Datos del alumno a actualizar' })
  @ApiResponse({ 
    status: 200, 
    description: 'Alumno actualizado correctamente', 
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
  async updateAlumnoById(
    @Param('id') id: string,
    @Body() updateAlumnoDto: UpdateAlumnoDto
  ): Promise<AlumnoUpdateResponseDto> {
    try {
      const alumnoActualizado = await this.updateAlumnoCase.executeById(id, updateAlumnoDto);
      return alumnoActualizado;
    } catch (error) {
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
    
    try {
      const resultado = await this.getPersonalAlumno.execute(codigo);
      
      
      if (resultado) {
      }
      
      return resultado;
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los alumnos' })
  @ApiQuery({ 
    name: 'includeApoderado', 
    required: false, 
    type: Boolean,
    description: 'Incluir información de apoderado en la respuesta (opcional)'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de alumnos obtenida exitosamente',
    type: [AlumnoResponseDto]
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de alumnos con información de apoderado',
    type: [AlumnoConApoderadoResponseDto],
    schema: {
      oneOf: [
        { type: 'array', items: { $ref: '#/components/schemas/AlumnoResponseDto' } },
        { type: 'array', items: { $ref: '#/components/schemas/AlumnoConApoderadoResponseDto' } }
      ]
    }
  })
  async getAllAlumnos(
    @Query('includeApoderado') includeApoderado?: boolean
  ) {
    
    const alumnos = await this.alumnoService.getAllAlumnos(includeApoderado);
    
    if (includeApoderado) {
    }
    
    return {
      success: true,
      message: 'Alumnos obtenidos exitosamente',
      data: alumnos,
      timestamp: new Date().toISOString()
    };
  }

  @Get('validate/:codigoQR')
  async validateAlumnoQr(@Param('codigoQR') codigoQr: string) {
    try {
      const resultado = await this.useCaseValidateAlumno.execute(codigoQr);
      return resultado;
    } catch (error) {
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
    try {
      const resultado = await this.useCaseAlumno.execute(createAlumnoDto);
      return resultado;
    } catch (error) {
      throw error; // Re-lanzar el error para que se maneje en el nivel superior
    }
  }

  /**
   * Obtiene todos los alumnos con paginación y filtros
   */
  @Get('list')
  @ApiOperation({ 
    summary: 'Obtener todos los alumnos con paginación',
    description: 'Obtiene todos los alumnos con paginación, filtros de búsqueda y opción de incluir información de apoderados'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite por página (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Buscar por código, nombre, apellido o DNI' })
  @ApiQuery({ name: 'includeApoderado', required: false, type: Boolean, description: 'Incluir información de apoderados' })
  @ApiResponse({ 
    status: 200, 
    description: 'Alumnos obtenidos exitosamente',
    type: AlumnoSearchResponseDto
  })
  async findAllWithPagination(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('includeApoderado') includeApoderado?: boolean
  ) {
    
    try {
      const alumnos = await this.getAlumnosUseCase.execute();
      
      // Aplicar filtros básicos
      let filteredAlumnos = alumnos;
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredAlumnos = alumnos.filter(alumno => 
          alumno.codigo?.toLowerCase().includes(searchLower) ||
          alumno.nombre?.toLowerCase().includes(searchLower) ||
          alumno.apellido?.toLowerCase().includes(searchLower) ||
          alumno.dni_alumno?.toLowerCase().includes(searchLower)
        );
      }
      
      // Aplicar paginación
      const total = filteredAlumnos.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedAlumnos = filteredAlumnos.slice(startIndex, endIndex);
      
      
      return {
        success: true,
        message: 'Alumnos obtenidos exitosamente',
        data: paginatedAlumnos,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un alumno por ID
   * IMPORTANTE: Esta ruta debe ir DESPUÉS de las rutas específicas para evitar conflictos
   */
  @Get('id/:id')
  @ApiOperation({ 
    summary: 'Obtener alumno por ID',
    description: 'Obtiene un alumno específico por su ID con todas sus relaciones'
  })
  @ApiParam({ name: 'id', description: 'ID único del alumno' })
  @ApiResponse({ 
    status: 200, 
    description: 'Alumno obtenido exitosamente',
    type: AlumnoResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Alumno no encontrado',
    type: ErrorResponseDto
  })
  async findOne(@Param('id') id: string) {
    
    try {
      const alumno = await this.alumnoService.findOne(id);
      
      if (!alumno) {
        throw new NotFoundException(`Alumno con ID ${id} no encontrado`);
      }
      
      return {
        success: true,
        message: 'Alumno obtenido exitosamente',
        data: alumno
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un alumno por ID
   */
  @Delete('id/:id')
  @ApiOperation({ 
    summary: 'Eliminar alumno',
    description: 'Elimina un alumno del sistema por su ID'
  })
  @ApiParam({ name: 'id', description: 'ID único del alumno' })
  @ApiResponse({ 
    status: 200, 
    description: 'Alumno eliminado exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Alumno no encontrado',
    type: ErrorResponseDto
  })
  async remove(@Param('id') id: string) {
    
    try {
      const alumno = await this.alumnoService.findOne(id);
      
      if (!alumno) {
        throw new NotFoundException(`Alumno con ID ${id} no encontrado`);
      }
      
      await this.alumnoService.remove(id);
      
      return {
        success: true,
        message: 'Alumno eliminado exitosamente'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verifica si un alumno tiene usuarios asignados
   */
  @Get('id/:id/usuarios')
  @ApiOperation({ 
    summary: 'Verificar usuarios asignados a alumno',
    description: 'Verifica si un alumno tiene usuarios asignados para autenticación'
  })
  @ApiParam({ name: 'id', description: 'ID único del alumno' })
  @ApiResponse({ 
    status: 200, 
    description: 'Verificación completada exitosamente'
  })
  async verificarUsuariosAsignados(@Param('id') id: string) {
    
    try {
      const alumno = await this.alumnoService.findOne(id);
      
      if (!alumno) {
        throw new NotFoundException(`Alumno con ID ${id} no encontrado`);
      }
      
      return {
        success: true,
        data: {
          tieneUsuarios: !!alumno.usuario,
          usuarios: alumno.usuario ? [alumno.usuario] : []
        }
      };
    } catch (error) {
      throw error;
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
    
    // Validar que se recibió un archivo
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    // Validar que el archivo sea específicamente .xlsx
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const allowedExtensions = ['.xlsx'];
    
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `Formato de archivo no válido. Solo se permiten archivos .xlsx. ` +
        `Recibido: ${file.originalname} (${file.mimetype})`
      );
    }

    // Validar que se proporcionó un ID de turno
    if (!turnoId) {
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
    }

    try {
      const startTime = Date.now();
      
      // Procesar archivo Excel usando el servicio especializado
      const alumnos = this.excelProcessorService.processExcelFile(file);
      
      const endTime = Date.now();
      const tiempoProceso = Math.round((endTime - startTime) / 1000);
      
      // Ejecutar servicio de importación
      const resultado = await this.importAlumnosExcelService.importarAlumnos(
        alumnos,
        turnoId,
        crearUsuarios
      );
      
      return resultado;
      
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al procesar el archivo: ${error.message}`);
    }
  }
}