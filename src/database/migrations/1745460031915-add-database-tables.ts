import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDatabaseTables1745460031915 implements MigrationInterface {
    name = 'AddDatabaseTables1745460031915'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`TURNOS\` (\`id_turno\` varchar(36) NOT NULL, \`hora_inicio\` time NOT NULL, \`hora_fin\` time NOT NULL, \`hora_limite\` time NOT NULL, \`turno\` varchar(20) NOT NULL, PRIMARY KEY (\`id_turno\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`AUXILIAR\` (\`id_auxiliar\` varchar(36) NOT NULL, \`dni_auxiliar\` char(8) NOT NULL, \`nombre\` varchar(100) NOT NULL, \`apellido\` varchar(100) NOT NULL, \`fecha_nacimiento\` date NOT NULL, \`correo_electronico\` varchar(100) NOT NULL, \`telefono\` varchar(15) NOT NULL, \`id_user\` varchar(36) NULL, UNIQUE INDEX \`REL_55c3be167bf65c8cfd08a96bfd\` (\`id_user\`), PRIMARY KEY (\`id_auxiliar\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`USUARIO\` (\`id_user\` varchar(36) NOT NULL, \`nombre_usuario\` varchar(50) NOT NULL, \`password_user\` varchar(100) NOT NULL, \`rol_usuario\` enum ('AUXILIAR', 'ALUMNO', 'ADMIN') NOT NULL, \`profile_image\` varchar(255) NULL, UNIQUE INDEX \`IDX_4ae24b7793423c00f1a57648e0\` (\`nombre_usuario\`), PRIMARY KEY (\`id_user\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ALUMNO\` (\`id_alumno\` varchar(36) NOT NULL, \`codigo\` varchar(10) NOT NULL, \`dni_alumno\` char(8) NOT NULL DEFAULT 'xxxxxxxx', \`nombre\` varchar(100) NOT NULL, \`apellido\` varchar(100) NOT NULL, \`fecha_nacimiento\` date NOT NULL, \`direccion\` varchar(100) NOT NULL DEFAULT 'xxxxxxxx', \`codigo_qr\` varchar(100) NOT NULL, \`nivel\` varchar(20) NOT NULL, \`grado\` int NOT NULL, \`seccion\` char(1) NOT NULL, \`id_turno\` varchar(36) NULL, \`id_user\` varchar(36) NULL, UNIQUE INDEX \`IDX_e0dd9c872283afc0ffbeed8125\` (\`codigo\`), UNIQUE INDEX \`REL_689a671722194592d4aa04659c\` (\`id_user\`), PRIMARY KEY (\`id_alumno\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ASISTENCIA\` (\`id_asistencia\` varchar(36) NOT NULL, \`hora_de_llegada\` time NOT NULL, \`hora_salida\` time NULL, \`estado_asistencia\` enum ('PUNTUAL', 'TARDANZA', 'AUSENTE') NOT NULL, \`fecha\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, \`id_alumno\` varchar(36) NOT NULL, PRIMARY KEY (\`id_asistencia\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ESTADO_ALUMNO\` (\`id_estado\` varchar(36) NOT NULL, \`estado\` varchar(20) NOT NULL DEFAULT 'activo', \`observacion\` varchar(255) NULL, \`fecha_actualizacion\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`id_alumno\` varchar(255) NOT NULL, PRIMARY KEY (\`id_estado\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`AUXILIAR\` ADD CONSTRAINT \`FK_55c3be167bf65c8cfd08a96bfd5\` FOREIGN KEY (\`id_user\`) REFERENCES \`USUARIO\`(\`id_user\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ALUMNO\` ADD CONSTRAINT \`FK_70599428afea9552d94ca4d2a50\` FOREIGN KEY (\`id_turno\`) REFERENCES \`TURNOS\`(\`id_turno\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ALUMNO\` ADD CONSTRAINT \`FK_689a671722194592d4aa04659c3\` FOREIGN KEY (\`id_user\`) REFERENCES \`USUARIO\`(\`id_user\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ASISTENCIA\` ADD CONSTRAINT \`FK_d3f07210729ae2df043d7f59713\` FOREIGN KEY (\`id_alumno\`) REFERENCES \`ALUMNO\`(\`id_alumno\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`ASISTENCIA\` DROP FOREIGN KEY \`FK_d3f07210729ae2df043d7f59713\``);
        await queryRunner.query(`ALTER TABLE \`ALUMNO\` DROP FOREIGN KEY \`FK_689a671722194592d4aa04659c3\``);
        await queryRunner.query(`ALTER TABLE \`ALUMNO\` DROP FOREIGN KEY \`FK_70599428afea9552d94ca4d2a50\``);
        await queryRunner.query(`ALTER TABLE \`AUXILIAR\` DROP FOREIGN KEY \`FK_55c3be167bf65c8cfd08a96bfd5\``);
        await queryRunner.query(`DROP TABLE \`ESTADO_ALUMNO\``);
        await queryRunner.query(`DROP TABLE \`ASISTENCIA\``);
        await queryRunner.query(`DROP INDEX \`REL_689a671722194592d4aa04659c\` ON \`ALUMNO\``);
        await queryRunner.query(`DROP INDEX \`IDX_e0dd9c872283afc0ffbeed8125\` ON \`ALUMNO\``);
        await queryRunner.query(`DROP TABLE \`ALUMNO\``);
        await queryRunner.query(`DROP INDEX \`IDX_4ae24b7793423c00f1a57648e0\` ON \`USUARIO\``);
        await queryRunner.query(`DROP TABLE \`USUARIO\``);
        await queryRunner.query(`DROP INDEX \`REL_55c3be167bf65c8cfd08a96bfd\` ON \`AUXILIAR\``);
        await queryRunner.query(`DROP TABLE \`AUXILIAR\``);
        await queryRunner.query(`DROP TABLE \`TURNOS\``);
    }

}
