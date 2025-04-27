import { Injectable, OnModuleInit } from '@nestjs/common';
import { UserSeeder } from './seeds/user.seeder';
import { TurnoSeeder } from './seeds/turno.seeder';
import { AlumnoSeeder } from './seeds/alumno.seeder';
import { AuxiliarSeeder } from './seeds/auxiliar.seeder';
import { EstadoAlumnoSeeder } from './seeds/estado-alumnos.seeder';

@Injectable()
export class SeederService implements OnModuleInit{

    constructor(private readonly userSeeder: UserSeeder,
                private readonly turnoSeeder: TurnoSeeder,
                private readonly alumnoSeeder: AlumnoSeeder,
                private readonly auxiliarSeeder: AuxiliarSeeder,
                private readonly estadoAlumnoSeeder: EstadoAlumnoSeeder,
    ){}

    async onModuleInit() {
        console.warn("Ejecutacion seeders");
        await this.userSeeder.run();
        await this.turnoSeeder.run();
        await this.alumnoSeeder.run();
        await this.auxiliarSeeder.run();
        await this.estadoAlumnoSeeder.run();
        console.log("Seeders ejecutados")
    }

}
