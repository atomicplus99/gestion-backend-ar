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
  import { AlumnoService } from './alumno.service';
import { Alumno } from './alumno.entity';
import { AlumnoDto } from 'src/auth/dto/alumno/alumno.dto';
import { CreateAlumnoUseCase } from './cases/create-alumno.usecase';
import { CreateAlumnoDto } from 'src/auth/dto/users/create-alumno.dto';
import { RegisterAlumnoDto } from 'src/auth/dto/alumno/registers/alumno-create.dto';
import { ValidarAlumnoUseCase } from './cases/validate-alumno-qr.usecases';

  
  @Controller('alumno')
  export class AlumnoController {
    constructor(
      private readonly alumnoService: AlumnoService,
      private readonly useCaseAlumno: CreateAlumnoUseCase,
      private readonly useCaseValidateAlumno: ValidarAlumnoUseCase
    ) {}
  


    @Get()
    async findAll(): Promise<Alumno[]> {
        return this.alumnoService.findAll();
    }

    @Get('validate/:codigoQR')
    async validateAlumnoQr(@Param('codigoQR') codigoQr:string){
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
  