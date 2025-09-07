import { Injectable, OnModuleInit } from '@nestjs/common';
import { AdministradorSeeder } from './seeds/administrador.seeder';


@Injectable()
export class SeederService implements OnModuleInit{

    constructor(private readonly administradorSeeder: AdministradorSeeder) {}

    async onModuleInit() {
        try {
            await this.administradorSeeder.run();
        } catch (error) {
            // Error al ejecutar seeder de administrador
        }
    }

}
