import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseInterceptors,
  UploadedFile
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


@Controller('alumnos')
export class AlumnoController {
  constructor(
    private readonly alumnoService: AlumnoService,
    private readonly useCaseAlumno: CreateAlumnoUseCase,
    private readonly useCaseValidateAlumno: ValidarAlumnoUseCase,
    private readonly getPersonalAlumno: GetAlumnoByCodigoUseCase,
    private readonly updateAlumnoCase: ActualizarAlumnoCase,
  ) { }


  
  @Put('actualizar/:codigo')
  async updateAlumno(
    @Param('codigo') codigo: string,
    @Body() updateAlumnoDto: UpdateAlumnoDto
  ): Promise<Alumno> {
    return this.updateAlumnoCase.execute(codigo, updateAlumnoDto);
  }

  @Get('codigo/:codigo')
  async findByCodigo(
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
  async importarExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { message: 'No se recibió ningún archivo' };
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const datos = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    const alumnosInsertados = await this.alumnoService.importarDesdeExcel(datos);
    return {
      message: 'Importación exitosa',
      total: alumnosInsertados.length,
      alumnos: alumnosInsertados,
    };
  }
}
