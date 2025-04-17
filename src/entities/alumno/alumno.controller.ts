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
  import { CreateAlumnoDto } from 'src/auth/dto/users/create-alumno.dto';
import { Alumno } from './alumno.entity';
  
  @Controller('alumno')
  export class AlumnoController {
    constructor(private readonly alumnoService: AlumnoService) {}
  


    @Get()
    async findAll(): Promise<Alumno[]> {
        return this.alumnoService.findAll();
    }




  
    @Post('registrar')
    create(@Body() createAlumnoDto: CreateAlumnoDto) {
      return this.alumnoService.create(createAlumnoDto);
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
  