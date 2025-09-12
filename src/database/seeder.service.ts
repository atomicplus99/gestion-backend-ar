import { Injectable, OnModuleInit } from '@nestjs/common';
import { AdministradorSeeder } from './seeds/administrador.seeder';
import { TurnoSeeder } from './seeds/turno.seeder';


@Injectable()
export class SeederService implements OnModuleInit{

    constructor(
        private readonly administradorSeeder: AdministradorSeeder,
        private readonly turnoSeeder: TurnoSeeder
    ) {}

    async onModuleInit() {
        try {
            await this.turnoSeeder.run();
            await this.administradorSeeder.run();
        } catch (error) {
            console.error('Error al ejecutar seeders:', error);
        }
    }

}
