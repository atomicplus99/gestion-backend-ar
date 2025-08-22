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
        
        try {
            await this.userSeeder.run();
        } catch (error) {
            console.error("❌ Error en UserSeeder:", error.message);
        }
        
        try {
            await this.turnoSeeder.run();
        } catch (error) {
            console.error("❌ Error en TurnoSeeder:", error.message);
        }
        
        try {
            await this.alumnoSeeder.run();
        } catch (error) {
            console.error("❌ Error en AlumnoSeeder:", error.message);
        }
        
        try {
            await this.auxiliarSeeder.run();
        } catch (error) {
            console.error("❌ Error en AuxiliarSeeder:", error.message);
        }
        
        try {
            await this.estadoAlumnoSeeder.run();
        } catch (error) {
            console.error("❌ Error en EstadoAlumnoSeeder:", error.message);
        }
        
        console.log("✅ Seeders ejecutados (con manejo de errores)");
    }

}
