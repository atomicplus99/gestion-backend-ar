// Script de prueba para verificar la relación entre apoderados y alumnos
const mysql = require('mysql2/promise');

async function testRelationship() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'gestion_colegio'
  });

  try {
    console.log('🔍 Verificando datos en la base de datos...\n');

    // 1. Verificar apoderados
    console.log('1. APODERADOS:');
    const [apoderados] = await connection.execute('SELECT * FROM APODERADO');
    console.log(`Total apoderados: ${apoderados.length}`);
    apoderados.forEach(ap => {
      console.log(`- ID: ${ap.id_apoderado}, Nombre: ${ap.nombre} ${ap.apellido || ''}, DNI: ${ap.dni}`);
    });

    console.log('\n2. ALUMNOS:');
    const [alumnos] = await connection.execute('SELECT * FROM ALUMNO LIMIT 5');
    console.log(`Total alumnos (mostrando 5): ${alumnos.length}`);
    alumnos.forEach(al => {
      console.log(`- ID: ${al.id_alumno}, Nombre: ${al.nombre} ${al.apellido}, Código: ${al.codigo}`);
    });

    console.log('\n3. RELACIÓN APODERADO_ALUMNO:');
    const [relaciones] = await connection.execute('SELECT * FROM APODERADO_ALUMNO');
    console.log(`Total relaciones: ${relaciones.length}`);
    if (relaciones.length > 0) {
      relaciones.forEach(rel => {
        console.log(`- Apoderado ID: ${rel.id_apoderado}, Alumno ID: ${rel.id_alumno}`);
      });
    } else {
      console.log('❌ NO HAY RELACIONES EN LA TABLA APODERADO_ALUMNO');
    }

    // 4. Verificar si hay algún apoderado con DNI específico
    console.log('\n4. BUSCANDO APODERADO CON DNI 78945612:');
    const [apoderadoEspecifico] = await connection.execute(
      'SELECT * FROM APODERADO WHERE dni = ?',
      ['78945612']
    );
    
    if (apoderadoEspecifico.length > 0) {
      const ap = apoderadoEspecifico[0];
      console.log(`✅ Apoderado encontrado: ${ap.nombre} ${ap.apellido || ''}`);
      console.log(`   ID: ${ap.id_apoderado}`);
      
      // Verificar si tiene alumnos asignados
      const [alumnosAsignados] = await connection.execute(
        'SELECT * FROM APODERADO_ALUMNO WHERE id_apoderado = ?',
        [ap.id_apoderado]
      );
      console.log(`   Alumnos asignados: ${alumnosAsignados.length}`);
      
      if (alumnosAsignados.length > 0) {
        for (const rel of alumnosAsignados) {
          const [alumno] = await connection.execute(
            'SELECT * FROM ALUMNO WHERE id_alumno = ?',
            [rel.id_alumno]
          );
          if (alumno.length > 0) {
            console.log(`   - Alumno: ${alumno[0].nombre} ${alumno[0].apellido} (${alumno[0].codigo})`);
          }
        }
      }
    } else {
      console.log('❌ No se encontró apoderado con DNI 78945612');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

testRelationship();
