-- Crear tablas sin foreign keys (versión simple)
USE gestion_academica_ar;

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
  PRIMARY KEY (`id_justificacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  PRIMARY KEY (`id_asistencia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ESTADO_ALUMNO` (
  `codigo` varchar(20) NOT NULL,
  `estado` enum('ACTIVO','INACTIVO','RETIRADO','EGRESADO') NOT NULL DEFAULT 'ACTIVO',
  `observacion` varchar(255) NULL,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  PRIMARY KEY (`id_actualizacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO migrations (timestamp, name) VALUES (1766054798883, 'Migration1766054798883');
