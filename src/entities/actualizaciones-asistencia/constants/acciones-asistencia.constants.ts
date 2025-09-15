/**
 * Constantes para las acciones de asistencia con textos amigables para el usuario
 */
export const ACCIONES_ASISTENCIA = {
  // Acciones de creación
  CREAR_ASISTENCIA_MANUAL: 'Registro Manual de Asistencia',
  CREAR_ASISTENCIA_JUSTIFICADA: 'Creación de Asistencia Justificada',
  
  // Acciones de modificación
  ACTUALIZAR_ASISTENCIA: 'Actualización de Asistencia',
  ANULAR_ASISTENCIA: 'Anulación de Asistencia',
  
  // Acciones de justificación
  APROBAR_JUSTIFICACION: 'Aprobación de Justificación',
  RECHAZAR_JUSTIFICACION: 'Rechazo de Justificación',
  
  // Acciones de eliminación
  ELIMINAR_JUSTIFICACION: 'Eliminación de Justificación',
} as const;

/**
 * Tipo para las claves de acciones
 */
export type AccionAsistencia = keyof typeof ACCIONES_ASISTENCIA;

/**
 * Función para obtener el texto amigable de una acción
 * @param accion - La acción técnica
 * @returns El texto amigable para el usuario
 */
export function getAccionAmigable(accion: string): string {
  return ACCIONES_ASISTENCIA[accion as AccionAsistencia] || accion;
}

/**
 * Función para obtener todas las acciones disponibles
 * @returns Objeto con todas las acciones y sus textos amigables
 */
export function getAllAcciones(): Record<string, string> {
  return ACCIONES_ASISTENCIA;
}
