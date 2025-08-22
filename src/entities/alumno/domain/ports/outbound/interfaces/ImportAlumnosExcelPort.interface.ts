import { AlumnoExcelData } from '../../../dtos/ImportAlumnosExcel.dto';
import { ImportAlumnosExcelResponse } from '../../../dtos/ImportAlumnosExcelResponse.dto';

export interface ImportAlumnosExcelPort {
  importarAlumnos(
    alumnos: AlumnoExcelData[],
    turnoId: string,
    crearUsuarios: boolean
  ): Promise<ImportAlumnosExcelResponse>;
}
