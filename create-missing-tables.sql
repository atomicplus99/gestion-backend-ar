-- Script para crear tablas faltantes manualmente
-- Ejecutar en el servidor: docker exec -i colegio_mysql mysql -uroot -p<password> gestion_academica_ar < create-missing-tables.sql

USE gestion_academica_ar;

-- Tabla JUSTIFICACIONES
CREATE TABLE IF NOT EXISTS `JUSTIFICACIONES` (
  `id_justificacion` varchar(36) NOT NULL,
  `id_alumno` varchar(36) NOT NULL,
  `id_auxiliar` varchar(36) NULL,
  `id_administrador` varchar(36) NULL,
  `id_director` varchar(36) NULL,
  `tipo_justificacion` enum('MEDICA','FAMILIAR','ACADEMICA','PERSONAL','EMERGENCIA') NOT NULL,
  `motivo` text NOT NULL,
  `fecha_de_justificacion` text NULL,
  `documentos_adjuntos` text NULL,
  `estado` enum('PENDIENTE','APROBADA','RECHAZADA','EN_REVISION') NOT NULL DEFAULT 'PENDIENTE',
  `observaciones_admin` text NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_justificacion`),
  KEY `FK_justificacion_alumno` (`id_alumno`),
  KEY `FK_justificacion_auxiliar` (`id_auxiliar`),
  KEY `FK_justificacion_administrador` (`id_administrador`),
  KEY `FK_justificacion_director` (`id_director`),
  CONSTRAINT `FK_justificacion_alumno` FOREIGN KEY (`id_alumno`) REFERENCES `ALUMNO` (`id_alumno`) ON DELETE CASCADE,
  CONSTRAINT `FK_justificacion_auxiliar` FOREIGN KEY (`id_auxiliar`) REFERENCES `AUXILIAR` (`id_auxiliar`) ON DELETE SET NULL,
  CONSTRAINT `FK_justificacion_administrador` FOREIGN KEY (`id_administrador`) REFERENCES `ADMINISTRADOR` (`id_administrador`) ON DELETE SET NULL,
  CONSTRAINT `FK_justificacion_director` FOREIGN KEY (`id_director`) REFERENCES `DIRECTOR` (`id_director`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla ASISTENCIA
CREATE TABLE IF NOT EXISTS `ASISTENCIA` (
  `id_asistencia` varchar(36) NOT NULL,
  `id_alumno` varchar(36) NOT NULL,
  `hora_de_llegada` time NULL,
  `hora_salida` time NULL,
  `estado` enum('PRESENTE','TARDE','AUSENTE','JUSTIFICADO') NOT NULL DEFAULT 'AUSENTE',
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `observaciones` text NULL,
  `fecha_creacion` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `fecha_actualizacion` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id_asistencia`),
  KEY `FK_asistencia_alumno` (`id_alumno`),
  CONSTRAINT `FK_asistencia_alumno` FOREIGN KEY (`id_alumno`) REFERENCES `ALUMNO` (`id_alumno`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla ASISTENCIA_EXTRA
CREATE TABLE IF NOT EXISTS `ASISTENCIA_EXTRA` (
  `id` varchar(36) NOT NULL,
  `turno_extra_id` varchar(36) NOT NULL,
  `alumno_id` varchar(36) NOT NULL,
  `hora_de_llegada` time NULL,
  `hora_salida` time NULL,
  `estado` enum('PRESENTE','TARDE','AUSENTE','JUSTIFICADO') NOT NULL DEFAULT 'AUSENTE',
  `observaciones` text NULL,
  `fecha_creacion` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `fecha_actualizacion` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_asistencia_extra_turno` (`turno_extra_id`),
  KEY `FK_asistencia_extra_alumno` (`alumno_id`),
  CONSTRAINT `FK_asistencia_extra_turno` FOREIGN KEY (`turno_extra_id`) REFERENCES `TURNOS_EXTRA` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_asistencia_extra_alumno` FOREIGN KEY (`alumno_id`) REFERENCES `ALUMNO` (`id_alumno`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla ESTADO_ALUMNO
CREATE TABLE IF NOT EXISTS `ESTADO_ALUMNO` (
  `codigo` varchar(20) NOT NULL,
  `estado` enum('ACTIVO','INACTIVO','RETIRADO','EGRESADO') NOT NULL DEFAULT 'ACTIVO',
  `observacion` varchar(255) NULL,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`codigo`),
  CONSTRAINT `FK_estado_alumno_codigo` FOREIGN KEY (`codigo`) REFERENCES `ALUMNO` (`codigo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla ausencias_masivas_programadas
CREATE TABLE IF NOT EXISTS `ausencias_masivas_programadas` (
  `id` varchar(36) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text NULL,
  `fecha_programada` date NOT NULL,
  `hora_programada` time NOT NULL,
  `nivel` varchar(20) NULL,
  `grado` int NULL,
  `seccion` char(1) NULL,
  `estado` enum('PENDIENTE','EJECUTADA','CANCELADA','ERROR') NOT NULL DEFAULT 'PENDIENTE',
  `observaciones` text NULL,
  `fecha_creacion` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `fecha_actualizacion` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `usuario_id` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_ausencias_programadas_usuario` (`usuario_id`),
  CONSTRAINT `FK_ausencias_programadas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `USUARIO` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla ausencias_masivas_log
CREATE TABLE IF NOT EXISTS `ausencias_masivas_log` (
  `id` varchar(36) NOT NULL,
  `programacion_id` varchar(36) NOT NULL,
  `fecha_ejecucion` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `hora_programada` time NULL,
  `hora_inicio` datetime NULL,
  `hora_fin` datetime NULL,
  `estado` enum('INICIADO','COMPLETADO','ERROR','CANCELADO') NOT NULL,
  `total_alumnos_procesados` int NOT NULL DEFAULT 0,
  `total_alumnos_afectados` int NOT NULL DEFAULT 0,
  `observaciones` text NULL,
  `mensaje_error` text NULL,
  `duracion_segundos` int NULL,
  PRIMARY KEY (`id`),
  KEY `FK_ausencias_log_programacion` (`programacion_id`),
  CONSTRAINT `FK_ausencias_log_programacion` FOREIGN KEY (`programacion_id`) REFERENCES `ausencias_masivas_programadas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla actualizaciones_asistencia
CREATE TABLE IF NOT EXISTS `actualizaciones_asistencia` (
  `id_actualizacion` varchar(36) NOT NULL,
  `tipo_cambio` varchar(255) NOT NULL,
  `valor_anterior` text NULL,
  `valor_nuevo` text NULL,
  `fecha_actualizacion` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `accion_realizada` varchar(100) NULL,
  `id_asistencia` varchar(36) NULL,
  `id_alumno` varchar(36) NULL,
  `id_auxiliar` varchar(36) NULL,
  `id_administrador` varchar(36) NULL,
  `id_director` varchar(36) NULL,
  PRIMARY KEY (`id_actualizacion`),
  KEY `FK_actualizacion_asistencia` (`id_asistencia`),
  KEY `FK_actualizacion_alumno` (`id_alumno`),
  KEY `FK_actualizacion_auxiliar` (`id_auxiliar`),
  KEY `FK_actualizacion_administrador` (`id_administrador`),
  KEY `FK_actualizacion_director` (`id_director`),
  CONSTRAINT `FK_actualizacion_asistencia` FOREIGN KEY (`id_asistencia`) REFERENCES `ASISTENCIA` (`id_asistencia`) ON DELETE CASCADE,
  CONSTRAINT `FK_actualizacion_alumno` FOREIGN KEY (`id_alumno`) REFERENCES `ALUMNO` (`id_alumno`) ON DELETE SET NULL,
  CONSTRAINT `FK_actualizacion_auxiliar` FOREIGN KEY (`id_auxiliar`) REFERENCES `AUXILIAR` (`id_auxiliar`) ON DELETE SET NULL,
  CONSTRAINT `FK_actualizacion_administrador` FOREIGN KEY (`id_administrador`) REFERENCES `ADMINISTRADOR` (`id_administrador`) ON DELETE SET NULL,
  CONSTRAINT `FK_actualizacion_director` FOREIGN KEY (`id_director`) REFERENCES `DIRECTOR` (`id_director`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Marcar migración como ejecutada
INSERT INTO migrations (timestamp, name) VALUES (1766054798883, 'Migration1766054798883');
