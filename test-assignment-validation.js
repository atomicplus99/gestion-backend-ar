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
    console.log('🔍 Verificando validación de asignación de alumnos...\n');

    // 1. Verificar estado actual de la base de datos
    console.log('1. ESTADO ACTUAL DE LA BASE DE DATOS:');
    
    const [apoderados] = await connection.execute('SELECT * FROM APODERADO LIMIT 3');
    console.log(`Total apoderados (mostrando 3): ${apoderados.length}`);
    apoderados.forEach(ap => {
      console.log(`- ID: ${ap.id_apoderado}, Nombre: ${ap.nombre} ${ap.apellido || ''}, DNI: ${ap.dni}`);
    });

    const [alumnos] = await connection.execute('SELECT * FROM ALUMNO LIMIT 5');
    console.log(`\nTotal alumnos (mostrando 5): ${alumnos.length}`);
    alumnos.forEach(al => {
      console.log(`- ID: ${al.id_alumno}, Nombre: ${al.nombre} ${al.apellido}, Código: ${al.codigo}`);
    });

    // 2. Verificar relaciones existentes
    console.log('\n2. RELACIONES EXISTENTES:');
    const [relaciones] = await connection.execute('SELECT * FROM APODERADO_ALUMNO');
    console.log(`Total relaciones: ${relaciones.length}`);
    
    if (relaciones.length > 0) {
      console.log('Relaciones encontradas:');
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
          console.log(`  - ${apoderado[0].nombre} ${apoderado[0].apellido || ''} → ${alumno[0].nombre} ${alumno[0].apellido} (${alumno[0].codigo})`);
        }
      }
    } else {
      console.log('❌ No hay relaciones en la tabla APODERADO_ALUMNO');
    }

    // 3. Simular intento de asignación duplicada
    console.log('\n3. SIMULANDO VALIDACIÓN DE ASIGNACIÓN DUPLICADA:');
    
    if (relaciones.length > 0) {
      const primeraRelacion = relaciones[0];
      console.log(`Intentando asignar alumno ${primeraRelacion.id_alumno} a otro apoderado...`);
      
      // Buscar otro apoderado (diferente al de la primera relación)
      const [otrosApoderados] = await connection.execute(
        'SELECT * FROM APODERADO WHERE id_apoderado != ? LIMIT 1',
        [primeraRelacion.id_apoderado]
      );
      
      if (otrosApoderados.length > 0) {
        const otroApoderado = otrosApoderados[0];
        console.log(`Otro apoderado encontrado: ${otroApoderado.nombre} ${otroApoderado.apellido || ''} (ID: ${otroApoderado.id_apoderado})`);
        
        // Verificar si el alumno ya está asignado a este otro apoderado
        const [yaAsignado] = await connection.execute(
          'SELECT * FROM APODERADO_ALUMNO WHERE id_apoderado = ? AND id_alumno = ?',
          [otroApoderado.id_apoderado, primeraRelacion.id_alumno]
        );
        
        if (yaAsignado.length > 0) {
          console.log('❌ CONFLICTO: El alumno ya está asignado a este apoderado');
        } else {
          console.log('✅ El alumno NO está asignado a este apoderado (esto es correcto)');
          
          // Verificar si está asignado a algún otro apoderado
          const [asignadoAOtro] = await connection.execute(
            'SELECT * FROM APODERADO_ALUMNO WHERE id_alumno = ? AND id_apoderado != ?',
            [primeraRelacion.id_alumno, otroApoderado.id_apoderado]
          );
          
          if (asignadoAOtro.length > 0) {
            console.log('❌ CONFLICTO: El alumno ya está asignado a otro apoderado');
            console.log('   Esto debería generar un error 409 (Conflict) en el backend');
          } else {
            console.log('✅ El alumno no está asignado a ningún apoderado (puede ser asignado)');
          }
        }
      } else {
        console.log('⚠️ Solo hay un apoderado en la base de datos, no se puede simular conflicto');
      }
    } else {
      console.log('⚠️ No hay relaciones existentes para simular conflicto');
    }

    // 4. Verificar reglas de negocio
    console.log('\n4. VERIFICACIÓN DE REGLAS DE NEGOCIO:');
    
    // Verificar si hay alumnos con múltiples apoderados (esto NO debería pasar)
    const [alumnosConMultiplesApoderados] = await connection.execute(`
      SELECT id_alumno, COUNT(*) as total_apoderados
      FROM APODERADO_ALUMNO 
      GROUP BY id_alumno 
      HAVING COUNT(*) > 1
    `);
    
    if (alumnosConMultiplesApoderados.length > 0) {
      console.log('❌ VIOLACIÓN DE REGLA: Alumnos con múltiples apoderados:');
      for (const alumno of alumnosConMultiplesApoderados) {
        const [infoAlumno] = await connection.execute(
          'SELECT nombre, apellido, codigo FROM ALUMNO WHERE id_alumno = ?',
          [alumno.id_alumno]
        );
        
        if (infoAlumno.length > 0) {
          console.log(`  - ${infoAlumno[0].nombre} ${infoAlumno[0].apellido} (${infoAlumno[0].codigo}): ${alumno.total_apoderados} apoderados`);
        }
      }
    } else {
      console.log('✅ REGLA CUMPLIDA: Ningún alumno tiene múltiples apoderados');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

testAssignmentValidation();






