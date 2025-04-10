// src/database/seeds/auxiliar.seeder.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Auxiliar } from 'src/entities/auxiliar/auxiliar.entity';
import { Usuario } from 'src/entities/usuario/usuario.entity';
import { RolUsuario } from 'src/common/enums/rol-usuario.enum';

@Injectable()
export class AuxiliarSeeder {
  constructor(private readonly dataSource: DataSource) {}

  async run() {
    const auxiliarRepo = this.dataSource.getRepository(Auxiliar);
    const usuarioRepo = this.dataSource.getRepository(Usuario);

    const count = await auxiliarRepo.count();
    if (count > 0) {
      console.warn('Ya existen registros en la tabla AUXILIAR.');
      return;
    }

    const usuariosAuxiliares = await usuarioRepo.find({
      where: { rol_usuario: RolUsuario.AUXILIAR },
    });

    const auxiliaresData = [
      {
        dni: '11111111',
        nombre: 'Ana',
        apellido: 'Martinez',
        nacimiento: '1990-02-15',
        correo: 'ana.martinez@example.com',
        telefono: '999123456',
        usuario: usuariosAuxiliares[0],
      },
      {
        dni: '22222222',
        nombre: 'Luis',
        apellido: 'García',
        nacimiento: '1985-08-22',
        correo: 'luis.garcia@example.com',
        telefono: '999234567',
        usuario: usuariosAuxiliares[1],
      },
      {
        dni: '33333333',
        nombre: 'Patricia',
        apellido: 'Salas',
        nacimiento: '1992-01-10',
        correo: 'patricia.salas@example.com',
        telefono: '999345678',
        usuario: usuariosAuxiliares[2],
      },
      {
        dni: '44444444',
        nombre: 'Carlos',
        apellido: 'Vera',
        nacimiento: '1994-07-30',
        correo: 'carlos.vera@example.com',
        telefono: '999456789',
        usuario: usuariosAuxiliares[3],
      },
      {
        dni: '55555555',
        nombre: 'Elena',
        apellido: 'Torres',
        nacimiento: '1989-05-18',
        correo: 'elena.torres@example.com',
        telefono: '999567890',
        usuario: usuariosAuxiliares[4],
      },
    ];

    const auxiliares: Auxiliar[] = auxiliaresData.map(data => {
      const aux = new Auxiliar();
      aux.dni_auxiliar = data.dni;
      aux.nombre = data.nombre;
      aux.apellido = data.apellido;
      aux.fecha_nacimiento = new Date(data.nacimiento);
      aux.correo_electronico = data.correo;
      aux.telefono = data.telefono;
      aux.usuario = data.usuario;
      return aux;
    });

    await auxiliarRepo.save(auxiliares);
    console.log('Auxiliares insertados correctamente. ✅');
  }
}
