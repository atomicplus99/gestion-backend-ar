import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1765988005785 implements MigrationInterface {
    name = 'Migration1765988005785'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`notificaciones\` (\`id\` varchar(36) NOT NULL, \`tipo\` enum ('scheduler', 'justificacion', 'usuario', 'asistencia', 'alumno') NOT NULL DEFAULT 'scheduler', \`prioridad\` enum ('baja', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media', \`estado\` enum ('no_leida', 'leida', 'archivada') NOT NULL DEFAULT 'no_leida', \`titulo\` varchar(255) NOT NULL, \`mensaje\` text NOT NULL, \`icono\` varchar(50) NULL, \`detalles\` json NULL, \`fecha_creacion\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`fecha_lectura\` timestamp NULL, \`fecha_archivado\` timestamp NULL, \`usuario_id\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`JUSTIFICACIONES\` (\`id_justificacion\` varchar(36) NOT NULL, \`tipo_justificacion\` enum ('MEDICA', 'FAMILIAR', 'ACADEMICA', 'PERSONAL', 'EMERGENCIA') NOT NULL, \`motivo\` text NOT NULL, \`fecha_de_justificacion\` text NULL, \`documentos_adjuntos\` text NULL, \`estado\` enum ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'EN_REVISION') NOT NULL DEFAULT 'PENDIENTE', \`observaciones_admin\` text NULL, \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id_alumno\` varchar(36) NOT NULL, \`id_auxiliar\` varchar(36) NULL, \`id_administrador\` varchar(36) NULL, \`id_director\` varchar(36) NULL, PRIMARY KEY (\`id_justificacion\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ASISTENCIA_EXTRA\` (\`id_asistencia_extra\` varchar(36) NOT NULL, \`hora_de_llegada\` time NULL, \`hora_salida\` time NULL, \`estado_asistencia\` enum ('PUNTUAL-EXTRA', 'TARDANZA-EXTRA', 'JUSTIFICADO-EXTRA', 'ANULADO-EXTRA', 'AUSENTE-EXTRA') NOT NULL DEFAULT 'PUNTUAL-EXTRA', \`fecha\` date NOT NULL, \`observaciones\` text NULL, \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id_alumno\` varchar(36) NOT NULL, PRIMARY KEY (\`id_asistencia_extra\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ASISTENCIA\` (\`id_asistencia\` varchar(36) NOT NULL, \`hora_de_llegada\` time NULL, \`hora_salida\` time NULL, \`estado_asistencia\` enum ('PUNTUAL', 'TARDANZA', 'AUSENTE', 'ANULADO', 'JUSTIFICADO', 'EXTRA') NOT NULL, \`fecha\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, \`id_alumno\` varchar(36) NOT NULL, PRIMARY KEY (\`id_asistencia\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`telegram_accounts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`apoderado_id\` varchar(255) NOT NULL, \`activo\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_6b41b8f672f3770304e370bea5\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ESTADO_ALUMNO\` (\`id_estado\` varchar(36) NOT NULL, \`estado\` varchar(20) NOT NULL DEFAULT 'activo', \`observacion\` varchar(255) NULL, \`fecha_actualizacion\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`id_alumno\` varchar(255) NOT NULL, PRIMARY KEY (\`id_estado\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ausencias_masivas_programadas\` (\`id\` varchar(36) NOT NULL, \`fecha_ejecucion\` date NOT NULL, \`hora_programada\` time NOT NULL, \`turnos_procesar\` varchar(100) NOT NULL, \`estado\` varchar(20) NOT NULL DEFAULT 'PROGRAMADA', \`observaciones\` text NULL, \`usuario_id\` varchar(255) NOT NULL, \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ausencias_masivas_log\` (\`id_log\` varchar(36) NOT NULL, \`fecha_ejecucion\` date NOT NULL, \`hora_inicio\` time NOT NULL, \`hora_programada\` time NULL, \`hora_fin\` time NULL, \`total_alumnos\` int NOT NULL, \`ausencias_creadas\` int NOT NULL, \`alumnos_con_asistencia\` int NOT NULL, \`turnos_procesados\` varchar(100) NOT NULL, \`estado\` varchar(20) NOT NULL DEFAULT 'COMPLETADO', \`observaciones\` text NULL, \`duracion_segundos\` int NULL, \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id_log\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`actualizaciones_asistencia\` (\`id\` varchar(36) NOT NULL, \`motivo\` text NOT NULL, \`accion_realizada\` varchar(100) NULL, \`fecha_actualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`id_asistencia\` varchar(36) NULL, \`id_alumno\` varchar(36) NULL, \`id_auxiliar\` varchar(36) NULL, \`id_administrador\` varchar(36) NULL, \`id_director\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`APODERADO_ALUMNO\` (\`id_apoderado\` varchar(36) NOT NULL, \`id_alumno\` varchar(36) NOT NULL, INDEX \`IDX_f216af213e2b9854f62c2008b1\` (\`id_apoderado\`), INDEX \`IDX_4502f74931d4bfc94c272a02cd\` (\`id_alumno\`), PRIMARY KEY (\`id_apoderado\`, \`id_alumno\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`ALUMNO\` ADD CONSTRAINT \`FK_70599428afea9552d94ca4d2a50\` FOREIGN KEY (\`id_turno\`) REFERENCES \`TURNOS\`(\`id_turno\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ALUMNO\` ADD CONSTRAINT \`FK_689a671722194592d4aa04659c3\` FOREIGN KEY (\`id_user\`) REFERENCES \`USUARIO\`(\`id_user\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`AUXILIAR\` ADD CONSTRAINT \`FK_55c3be167bf65c8cfd08a96bfd5\` FOREIGN KEY (\`id_user\`) REFERENCES \`USUARIO\`(\`id_user\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ADMINISTRADOR\` ADD CONSTRAINT \`FK_bb2f7ac1373f2db87a1750bb643\` FOREIGN KEY (\`id_user\`) REFERENCES \`USUARIO\`(\`id_user\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`DIRECTOR\` ADD CONSTRAINT \`FK_5a0072981c91f048323ca01eb94\` FOREIGN KEY (\`id_user\`) REFERENCES \`USUARIO\`(\`id_user\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`TURNOS_EXTRA\` ADD CONSTRAINT \`FK_0f4c1bde190f141ea8e628313bf\` FOREIGN KEY (\`alumno_id\`) REFERENCES \`ALUMNO\`(\`id_alumno\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`TURNOS_EXTRA\` ADD CONSTRAINT \`FK_17475a91a0e8b22cf1abf90b0d5\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`USUARIO\`(\`id_user\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`telegram_chats\` ADD CONSTRAINT \`FK_271d739cf69f60c5dff58d0d24b\` FOREIGN KEY (\`id_telegram_user\`) REFERENCES \`telegram_users\`(\`id_telegram_user\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`notificaciones\` ADD CONSTRAINT \`FK_2c6341d5bd206ff522b35aa6b69\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`USUARIO\`(\`id_user\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`JUSTIFICACIONES\` ADD CONSTRAINT \`FK_dc9611276be3f9dc4830660fbfb\` FOREIGN KEY (\`id_alumno\`) REFERENCES \`ALUMNO\`(\`id_alumno\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`JUSTIFICACIONES\` ADD CONSTRAINT \`FK_724e3ae5655202b446648dfbd61\` FOREIGN KEY (\`id_auxiliar\`) REFERENCES \`AUXILIAR\`(\`id_auxiliar\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`JUSTIFICACIONES\` ADD CONSTRAINT \`FK_f110208606ba01a8089f8f073c7\` FOREIGN KEY (\`id_administrador\`) REFERENCES \`ADMINISTRADOR\`(\`id_administrador\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`JUSTIFICACIONES\` ADD CONSTRAINT \`FK_460abbbaa5732b5b13277ac4fd7\` FOREIGN KEY (\`id_director\`) REFERENCES \`DIRECTOR\`(\`id_director\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ASISTENCIA_EXTRA\` ADD CONSTRAINT \`FK_2556c0e206f1e796dd3ca8aa7bb\` FOREIGN KEY (\`id_alumno\`) REFERENCES \`ALUMNO\`(\`id_alumno\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ASISTENCIA\` ADD CONSTRAINT \`FK_d3f07210729ae2df043d7f59713\` FOREIGN KEY (\`id_alumno\`) REFERENCES \`ALUMNO\`(\`id_alumno\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`telegram_accounts\` ADD CONSTRAINT \`FK_fd80359104b7489d1918203d8fc\` FOREIGN KEY (\`apoderado_id\`) REFERENCES \`APODERADO\`(\`id_apoderado\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ausencias_masivas_programadas\` ADD CONSTRAINT \`FK_0a1a97ff6bd686cdc49290e2e78\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`USUARIO\`(\`id_user\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`actualizaciones_asistencia\` ADD CONSTRAINT \`FK_6bbc02d4fd9b527ca76a5f37a0c\` FOREIGN KEY (\`id_asistencia\`) REFERENCES \`ASISTENCIA\`(\`id_asistencia\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`actualizaciones_asistencia\` ADD CONSTRAINT \`FK_bcd00e252f5c308f245a0e60946\` FOREIGN KEY (\`id_alumno\`) REFERENCES \`ALUMNO\`(\`id_alumno\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`actualizaciones_asistencia\` ADD CONSTRAINT \`FK_b0cb25ec6b8f2af75f42bf020c2\` FOREIGN KEY (\`id_auxiliar\`) REFERENCES \`AUXILIAR\`(\`id_auxiliar\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`actualizaciones_asistencia\` ADD CONSTRAINT \`FK_7430ff7200b01b71959a1457933\` FOREIGN KEY (\`id_administrador\`) REFERENCES \`ADMINISTRADOR\`(\`id_administrador\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`actualizaciones_asistencia\` ADD CONSTRAINT \`FK_221b9ff8a12ebf596c4c1b5ca8d\` FOREIGN KEY (\`id_director\`) REFERENCES \`DIRECTOR\`(\`id_director\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`APODERADO_ALUMNO\` ADD CONSTRAINT \`FK_f216af213e2b9854f62c2008b1f\` FOREIGN KEY (\`id_apoderado\`) REFERENCES \`APODERADO\`(\`id_apoderado\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`APODERADO_ALUMNO\` ADD CONSTRAINT \`FK_4502f74931d4bfc94c272a02cde\` FOREIGN KEY (\`id_alumno\`) REFERENCES \`ALUMNO\`(\`id_alumno\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`APODERADO_ALUMNO\` DROP FOREIGN KEY \`FK_4502f74931d4bfc94c272a02cde\``);
        await queryRunner.query(`ALTER TABLE \`APODERADO_ALUMNO\` DROP FOREIGN KEY \`FK_f216af213e2b9854f62c2008b1f\``);
        await queryRunner.query(`ALTER TABLE \`actualizaciones_asistencia\` DROP FOREIGN KEY \`FK_221b9ff8a12ebf596c4c1b5ca8d\``);
        await queryRunner.query(`ALTER TABLE \`actualizaciones_asistencia\` DROP FOREIGN KEY \`FK_7430ff7200b01b71959a1457933\``);
        await queryRunner.query(`ALTER TABLE \`actualizaciones_asistencia\` DROP FOREIGN KEY \`FK_b0cb25ec6b8f2af75f42bf020c2\``);
        await queryRunner.query(`ALTER TABLE \`actualizaciones_asistencia\` DROP FOREIGN KEY \`FK_bcd00e252f5c308f245a0e60946\``);
        await queryRunner.query(`ALTER TABLE \`actualizaciones_asistencia\` DROP FOREIGN KEY \`FK_6bbc02d4fd9b527ca76a5f37a0c\``);
        await queryRunner.query(`ALTER TABLE \`ausencias_masivas_programadas\` DROP FOREIGN KEY \`FK_0a1a97ff6bd686cdc49290e2e78\``);
        await queryRunner.query(`ALTER TABLE \`telegram_accounts\` DROP FOREIGN KEY \`FK_fd80359104b7489d1918203d8fc\``);
        await queryRunner.query(`ALTER TABLE \`ASISTENCIA\` DROP FOREIGN KEY \`FK_d3f07210729ae2df043d7f59713\``);
        await queryRunner.query(`ALTER TABLE \`ASISTENCIA_EXTRA\` DROP FOREIGN KEY \`FK_2556c0e206f1e796dd3ca8aa7bb\``);
        await queryRunner.query(`ALTER TABLE \`JUSTIFICACIONES\` DROP FOREIGN KEY \`FK_460abbbaa5732b5b13277ac4fd7\``);
        await queryRunner.query(`ALTER TABLE \`JUSTIFICACIONES\` DROP FOREIGN KEY \`FK_f110208606ba01a8089f8f073c7\``);
        await queryRunner.query(`ALTER TABLE \`JUSTIFICACIONES\` DROP FOREIGN KEY \`FK_724e3ae5655202b446648dfbd61\``);
        await queryRunner.query(`ALTER TABLE \`JUSTIFICACIONES\` DROP FOREIGN KEY \`FK_dc9611276be3f9dc4830660fbfb\``);
        await queryRunner.query(`ALTER TABLE \`notificaciones\` DROP FOREIGN KEY \`FK_2c6341d5bd206ff522b35aa6b69\``);
        await queryRunner.query(`ALTER TABLE \`telegram_chats\` DROP FOREIGN KEY \`FK_271d739cf69f60c5dff58d0d24b\``);
        await queryRunner.query(`ALTER TABLE \`TURNOS_EXTRA\` DROP FOREIGN KEY \`FK_17475a91a0e8b22cf1abf90b0d5\``);
        await queryRunner.query(`ALTER TABLE \`TURNOS_EXTRA\` DROP FOREIGN KEY \`FK_0f4c1bde190f141ea8e628313bf\``);
        await queryRunner.query(`ALTER TABLE \`DIRECTOR\` DROP FOREIGN KEY \`FK_5a0072981c91f048323ca01eb94\``);
        await queryRunner.query(`ALTER TABLE \`ADMINISTRADOR\` DROP FOREIGN KEY \`FK_bb2f7ac1373f2db87a1750bb643\``);
        await queryRunner.query(`ALTER TABLE \`AUXILIAR\` DROP FOREIGN KEY \`FK_55c3be167bf65c8cfd08a96bfd5\``);
        await queryRunner.query(`ALTER TABLE \`ALUMNO\` DROP FOREIGN KEY \`FK_689a671722194592d4aa04659c3\``);
        await queryRunner.query(`ALTER TABLE \`ALUMNO\` DROP FOREIGN KEY \`FK_70599428afea9552d94ca4d2a50\``);
        await queryRunner.query(`DROP INDEX \`IDX_4502f74931d4bfc94c272a02cd\` ON \`APODERADO_ALUMNO\``);
        await queryRunner.query(`DROP INDEX \`IDX_f216af213e2b9854f62c2008b1\` ON \`APODERADO_ALUMNO\``);
        await queryRunner.query(`DROP TABLE \`APODERADO_ALUMNO\``);
        await queryRunner.query(`DROP TABLE \`actualizaciones_asistencia\``);
        await queryRunner.query(`DROP TABLE \`ausencias_masivas_log\``);
        await queryRunner.query(`DROP TABLE \`ausencias_masivas_programadas\``);
        await queryRunner.query(`DROP TABLE \`ESTADO_ALUMNO\``);
        await queryRunner.query(`DROP INDEX \`IDX_6b41b8f672f3770304e370bea5\` ON \`telegram_accounts\``);
        await queryRunner.query(`DROP TABLE \`telegram_accounts\``);
        await queryRunner.query(`DROP TABLE \`ASISTENCIA\``);
        await queryRunner.query(`DROP TABLE \`ASISTENCIA_EXTRA\``);
        await queryRunner.query(`DROP TABLE \`JUSTIFICACIONES\``);
        await queryRunner.query(`DROP TABLE \`notificaciones\``);
    }

}
