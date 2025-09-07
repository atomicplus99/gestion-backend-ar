// Script de prueba para verificar la validación de asignación de alumnos
const mysql = require('mysql2/promise');

async function testAssignmentValidation() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'gestion_colegio'
  });

  try {

    // 1. Verificar estado actual de la base de datos
    
    const [apoderados] = await connection.execute('SELECT * FROM APODERADO LIMIT 3');
    apoderados.forEach(ap => {
    });

    const [alumnos] = await connection.execute('SELECT * FROM ALUMNO LIMIT 5');
    alumnos.forEach(al => {
    });

    // 2. Verificar relaciones existentes
    const [relaciones] = await connection.execute('SELECT * FROM APODERADO_ALUMNO');
    
    if (relaciones.length > 0) {
      for (const rel of relaciones) {
        // Obtener información del apoderado
        const [apoderado] = await connection.execute(
          'SELECT nombre, apellido FROM APODERADO WHERE id_apoderado = ?',
          [rel.id_apoderado]
        );
        
        // Obtener información del alumno
        const [alumno] = await connection.execute(
          'SELECT nombre, apellido, codigo FROM ALUMNO WHERE id_alumno = ?',
          [rel.id_alumno]
        );
        
        if (apoderado.length > 0 && alumno.length > 0) {
        }
      }
    } else {
    }

    // 3. Simular intento de asignación duplicada
    
    if (relaciones.length > 0) {
      const primeraRelacion = relaciones[0];
      
      // Buscar otro apoderado (diferente al de la primera relación)
      const [otrosApoderados] = await connection.execute(
        'SELECT * FROM APODERADO WHERE id_apoderado != ? LIMIT 1',
        [primeraRelacion.id_apoderado]
      );
      
      if (otrosApoderados.length > 0) {
        const otroApoderado = otrosApoderados[0];
        
        // Verificar si el alumno ya está asignado a este otro apoderado
        const [yaAsignado] = await connection.execute(
          'SELECT * FROM APODERADO_ALUMNO WHERE id_apoderado = ? AND id_alumno = ?',
          [otroApoderado.id_apoderado, primeraRelacion.id_alumno]
        );
        
        if (yaAsignado.length > 0) {
        } else {
          
          // Verificar si está asignado a algún otro apoderado
          const [asignadoAOtro] = await connection.execute(
            'SELECT * FROM APODERADO_ALUMNO WHERE id_alumno = ? AND id_apoderado != ?',
            [primeraRelacion.id_alumno, otroApoderado.id_apoderado]
          );
          
          if (asignadoAOtro.length > 0) {
          } else {
          }
        }
      } else {
      }
    } else {
    }

    // 4. Verificar reglas de negocio
    
    // Verificar si hay alumnos con múltiples apoderados (esto NO debería pasar)
    const [alumnosConMultiplesApoderados] = await connection.execute(`
      SELECT id_alumno, COUNT(*) as total_apoderados
      FROM APODERADO_ALUMNO 
      GROUP BY id_alumno 
      HAVING COUNT(*) > 1
    `);
    
    if (alumnosConMultiplesApoderados.length > 0) {
      for (const alumno of alumnosConMultiplesApoderados) {
        const [infoAlumno] = await connection.execute(
          'SELECT nombre, apellido, codigo FROM ALUMNO WHERE id_alumno = ?',
          [alumno.id_alumno]
        );
        
        if (infoAlumno.length > 0) {
        }
      }
    } else {
    }

  } catch (error) {
  } finally {
    await connection.end();
  }
}

testAssignmentValidation();






