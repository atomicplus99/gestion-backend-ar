import { Injectable } from '@nestjs/common';
import { AlumnoRepositoryInterface } from '../../outbound/interfaces/AlumnoRepository.interface';
import { ImportAlumnosExcelPort } from '../../outbound/interfaces/ImportAlumnosExcelPort.interface';
import { ImportAlumnosExcelDto } from '../../../dtos/ImportAlumnosExcel.dto';
import { ImportAlumnosExcelResponse } from '../../../dtos/ImportAlumnosExcelResponse.dto';

@Injectable()
export class ImportAlumnosExcelUseCase {
  constructor(
    private readonly alumnoRepository: AlumnoRepositoryInterface,
    private readonly importAlumnosExcelPort: ImportAlumnosExcelPort
  ) {}

  async execute(
    data: ImportAlumnosExcelDto
  ): Promise<ImportAlumnosExcelResponse> {
    // Validar códigos duplicados
    const codigos = data.alumnos
      .map(alumno => alumno.codigo || alumno.numeroDocumento)
      .filter(Boolean);

    if (codigos.length > 0) {
      // Verificar duplicados usando el repositorio existente
      for (const codigo of codigos) {
        if (codigo) {
          const existingAlumno = await this.alumnoRepository.findByCodigoAlumno(codigo);
          if (existingAlumno) {
            throw new Error(`Código duplicado: ${codigo}`);
          }
        }
      }
    }

    // Procesar la importación
    const resultado = await this.importAlumnosExcelPort.importarAlumnos(
      data.alumnos,
      data.turnoId,
      data.crearUsuarios
    );

    return resultado;
  }
}
