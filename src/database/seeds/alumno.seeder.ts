import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Alumno } from 'src/entities/alumno/alumno.entity';
import { Turno } from 'src/entities/turno/turno.entity';
import { Usuario } from 'src/entities/usuario/usuario.entity';
import { RolUsuario } from 'src/common/enums/rol-usuario.enum';
import { randomUUID } from 'crypto'; // 👈 importa esto

@Injectable()
export class AlumnoSeeder {
  constructor(private readonly dataSource: DataSource) {}

  async run() {
    const alumnoRepo = this.dataSource.getRepository(Alumno);
    const turnoRepo = this.dataSource.getRepository(Turno);
    const usuarioRepo = this.dataSource.getRepository(Usuario);

    const count = await alumnoRepo.count();
    if (count > 0) {
      console.warn('Ya existen registros en la tabla ALUMNO.');
      return;
    }

    const turnos = await turnoRepo.find();
    const usuarios = await usuarioRepo.find({ where: { rol_usuario: RolUsuario.ALUMNO } });

    const alumnosData = [
      { dni: '12345678', nombre: 'Carlos', apellido: 'Ramirez', nacimiento: '2004-06-15', direccion: 'Av. Perú 123', turno: 'mañana', user: 'alumno1' },
      { dni: '22345678', nombre: 'Lucía', apellido: 'Gómez', nacimiento: '2005-01-20', direccion: 'Jr. Lima 456', turno: 'mañana', user: 'alumno2' },
      { dni: '32345678', nombre: 'Miguel', apellido: 'Lopez', nacimiento: '2003-03-11', direccion: 'Psje. Arica 789', turno: 'mañana', user: 'alumno3' },
      { dni: '42345678', nombre: 'Sandra', apellido: 'Torres', nacimiento: '2004-08-29', direccion: 'Calle Ficticia 123', turno: 'mañana', user: 'alumno4' },
      { dni: '52345678', nombre: 'Luis', apellido: 'Martinez', nacimiento: '2003-10-17', direccion: 'Av. Central 777', turno: 'mañana', user: 'alumno5' },
      { dni: '62345678', nombre: 'Diana', apellido: 'Sanchez', nacimiento: '2004-12-08', direccion: 'Jr. Piura 123', turno: 'tarde', user: 'alumno6' },
      { dni: '72345678', nombre: 'Pedro', apellido: 'Rojas', nacimiento: '2005-02-14', direccion: 'Av. Grau 333', turno: 'tarde', user: 'alumno7' },
      { dni: '82345678', nombre: 'Ana', apellido: 'Fernandez', nacimiento: '2003-07-07', direccion: 'Psje. Libertad 222', turno: 'tarde', user: 'alumno8' },
      { dni: '92345678', nombre: 'Marco', apellido: 'Rivas', nacimiento: '2004-11-12', direccion: 'Jr. Arequipa 555', turno: 'tarde', user: 'alumno9' },
      { dni: '03345678', nombre: 'Elena', apellido: 'Campos', nacimiento: '2005-04-03', direccion: 'Av. San Martín 101', turno: 'tarde', user: 'alumno10' },
    ];

    const alumnos: Alumno[] = [];

    for (let i = 0; i < alumnosData.length; i++) {
      const data = alumnosData[i];
      const alumno = new Alumno();
      alumno.dni_alumno = data.dni;
      alumno.nombre = data.nombre;
      alumno.apellido = data.apellido;
      alumno.fecha_nacimiento = new Date(data.nacimiento);
      alumno.direccion = data.direccion;

      // Generar UUID como código QR
      alumno.codigo_qr = randomUUID(); // 👈 Aquí está el cambio

      // Generar código como "000392023"
      const numero = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
      const año = new Date().getFullYear();
      alumno.codigo = `${numero}${año}`;

      alumno.nivel = 'Secundaria';
      alumno.grado = (i % 5) + 1;
      alumno.seccion = String.fromCharCode(65 + (i % 5));

      const turno = turnos.find(t => t.turno === data.turno);
      if (!turno) throw new Error(`No se encontró el turno: ${data.turno}`);
      alumno.turno = turno;

      const usuario = usuarios.find(u => u.nombre_usuario === data.user);
      if (!usuario) throw new Error(`No se encontró el usuario: ${data.user}`);
      alumno.usuario = usuario;

      alumnos.push(alumno);
    }

    await alumnoRepo.save(alumnos);
    console.log('Alumnos insertados correctamente ✅');
  }
}
