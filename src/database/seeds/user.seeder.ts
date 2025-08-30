import { Injectable } from '@nestjs/common';
import { RolUsuario } from 'src/common/enums/rol-usuario.enum';
import { Usuario } from 'src/entities/usuario/usuario.entity';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserSeeder {
    constructor(private readonly dataSource: DataSource) { }

    async run() {
        const userRepo = this.dataSource.getRepository(Usuario);
        const countRegisters = await userRepo.count();

        if (countRegisters > 0) {
            console.warn("Usuarios con registros detectados, no se generarán registros de prueba");
            return;
        }

        const saltRounds = 10;

        const usuarios: Usuario[] = await Promise.all([
            // Alumnos
            this.createUser('alumno1', 'pass123', RolUsuario.ALUMNO, saltRounds),
            this.createUser('alumno2', 'pass123', RolUsuario.ALUMNO, saltRounds),
            this.createUser('alumno3', 'pass123', RolUsuario.ALUMNO, saltRounds),
            this.createUser('alumno4', 'pass123', RolUsuario.ALUMNO, saltRounds),
            this.createUser('alumno5', 'pass123', RolUsuario.ALUMNO, saltRounds),
            this.createUser('alumno6', 'pass123', RolUsuario.ALUMNO, saltRounds),
            this.createUser('alumno7', 'pass123', RolUsuario.ALUMNO, saltRounds),
            this.createUser('alumno8', 'pass123', RolUsuario.ALUMNO, saltRounds),
            this.createUser('alumno9', 'pass123', RolUsuario.ALUMNO, saltRounds),
            this.createUser('alumno10', 'pass123', RolUsuario.ALUMNO, saltRounds),

            // Auxiliares
            this.createUser('auxiliar1', 'pass456', RolUsuario.AUXILIAR, saltRounds),
            this.createUser('auxiliar2', 'pass456', RolUsuario.AUXILIAR, saltRounds),
            this.createUser('auxiliar3', 'pass456', RolUsuario.AUXILIAR, saltRounds),
            this.createUser('auxiliar4', 'pass456', RolUsuario.AUXILIAR, saltRounds),
            this.createUser('auxiliar5', 'pass456', RolUsuario.AUXILIAR, saltRounds),
        ]);

        try {
            await userRepo.save(usuarios);
            console.log("Usuarios insertados correctamente ✅");
        } catch (error) {
            console.error("❌ Error insertando usuarios:", error.message);
            // Intentar insertar uno por uno para identificar cuál falla
            for (const usuario of usuarios) {
                try {
                    await userRepo.save(usuario);
                    console.log(`✅ Usuario ${usuario.nombre_usuario} insertado`);
                } catch (individualError) {
                    console.error(`❌ Error insertando usuario ${usuario.nombre_usuario}:`, individualError.message);
                }
            }
        }
    }

    private async createUser(nombre_usuario: string, password: string, rol_usuario: RolUsuario, saltRounds: number): Promise<Usuario> {
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const usuario = new Usuario();
        usuario.nombre_usuario = nombre_usuario;
        usuario.password_user = hashedPassword;
        usuario.rol_usuario = rol_usuario;
        usuario.profile_image = 'no-image.png';
        usuario.activo = true;

        return usuario;
    }
}
