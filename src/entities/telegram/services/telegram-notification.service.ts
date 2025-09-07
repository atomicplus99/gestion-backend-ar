import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
const TelegramBot = require('node-telegram-bot-api');
import { TelegramUser } from '../telegram-user.entity';
import { TelegramChat } from '../telegram-chat.entity';
import { Alumno } from '../../alumno/infraestructure/orm/entities/alumno.entity';
import { Asistencia } from '../../asistencia/asistencia.entity';
import { EstadoAsistencia } from '../../asistencia/enums/estado-asistencia.enum';
import { TelegramApoderadoService } from './telegram-apoderado.service';

@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);
  private bot: any;
  
     // Estado de registro de usuarios
   private usuariosEnRegistro = new Map<number, {
     estado: 'INICIANDO' | 'CONFIRMANDO' | 'CONSULTANDO_ASISTENCIA';
     dniApoderado?: string;
     apoderado?: {
       nombres: string;
       apellidos: string;
       alumnos: Array<{
         id_alumno: string;
         dni: string;
         nombres: string;
         apellidos: string;
         codigo: string;
         nivel: string;
         grado: number;
         seccion: string;
       }>;
     };
   }>();

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(TelegramUser)
    private readonly telegramUserRepository: Repository<TelegramUser>,
    @InjectRepository(TelegramChat)
    private readonly telegramChatRepository: Repository<TelegramChat>,
    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,
    private readonly telegramApoderadoService: TelegramApoderadoService,
  ) {
    this.initializeBot();
  }

  private initializeBot() {
    try {
      this.logger.log('🔍 Iniciando configuración del bot de Telegram...');
      
      const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

      
      if (!token) {
        return;
      }

      this.logger.log('🤖 Creando instancia del bot...');
      this.bot = new TelegramBot(token, { polling: true });
      
      this.logger.log('⚙️ Configurando comandos del bot...');
      // Configurar comandos del bot
      this.configurarComandos();
      
      this.logger.log('✅ Bot de Telegram inicializado correctamente');
    } catch (error) {
      this.logger.error(`❌ Error inicializando bot: ${error.message}`);
      this.logger.error(`❌ Stack trace: ${error.stack}`);
    }
  }

  /**
   * Configura los comandos y manejadores del bot
   */
  private configurarComandos() {
    // Comando /start - Bienvenida
    this.bot.onText(/\/start/, (msg) => {
      this.enviarMensajeBienvenida(msg.chat.id);
    });

    this.logger.log('📱 Configurando comando /help...');
    // Comando /help - Ayuda
    this.bot.onText(/\/help/, (msg) => {
      this.logger.log(`📨 Comando /help recibido de ${msg.from?.first_name}`);
      this.enviarMensajeAyuda(msg.chat.id);
    });

    this.logger.log('📱 Configurando comando /info...');
    // Comando /info - Información del sistema
    this.bot.onText(/\/info/, (msg) => {
      this.logger.log(`📨 Comando /info recibido de ${msg.from?.first_name}`);
      this.enviarInformacionSistema(msg.chat.id);
    });

         this.logger.log('📱 Configurando comando /registro...');
     // Comando /registro - Registrarse como apoderado
     this.bot.onText(/\/registro/, (msg) => {
       this.logger.log(`📨 Comando /registro recibido de ${msg.from?.first_name}`);
       this.iniciarRegistroApoderado(msg.chat.id, msg.from);
     });

     this.logger.log('📱 Configurando comando /asistencia...');
     // Comando /asistencia - Ver asistencia de alumnos
     this.bot.onText(/\/asistencia/, (msg) => {
       this.logger.log(`📨 Comando /asistencia recibido de ${msg.from?.first_name}`);
       this.iniciarConsultaAsistencia(msg.chat.id, msg.from);
     });

     this.logger.log('📱 Configurando comando /estado...');
     // Comando /estado - Ver estado actual del usuario
     this.bot.onText(/\/estado/, (msg) => {
       this.logger.log(`📨 Comando /estado recibido de ${msg.from?.first_name}`);
       this.verificarEstadoUsuario(msg.chat.id, msg.from);
     });

    this.logger.log('📱 Configurando manejador de mensajes generales...');
    // Manejar mensajes de texto normales
    this.bot.on('message', (msg) => {
      if (!msg.text?.startsWith('/')) {
        this.logger.log(`💬 Mensaje recibido de ${msg.from?.first_name}: ${msg.text}`);
        this.procesarMensajeTexto(msg);
      }
    });

    // Manejar errores del bot
    this.bot.on('polling_error', (error) => {
      this.logger.error(`❌ Error de polling: ${error.message}`);
    });

    this.logger.log('✅ Todos los comandos configurados exitosamente');
  }

  /**
   * Envía notificación de asistencia al apoderado del alumno
   */
  async notificarAsistenciaApoderado(
    asistencia: Asistencia | any, 
    motivo?: string, 
    tipoOperacion?: 'REGISTRO' | 'ACTUALIZACION' | 'ANULACION' | 'JUSTIFICACION'
  ): Promise<void> {
    try {
      this.logger.log(`🚀🚀🚀 INICIANDO NOTIFICACIÓN TELEGRAM 🚀🚀🚀`);
      this.logger.log(`📱 Alumno: ${asistencia.alumno.codigo} (ID: ${asistencia.alumno.id_alumno})`);
      this.logger.log(`📅 Fecha: ${asistencia.fecha}`);
      this.logger.log(`⏰ Hora: ${asistencia.hora_de_llegada}`);
      this.logger.log(`📊 Estado: ${asistencia.estado_asistencia}`);
      
      if (!this.bot) {
        this.logger.warn('⚠️ Bot no inicializado, saltando notificación');
        return;
      }

      this.logger.log(`📱 Enviando notificación para alumno: ${asistencia.alumno.codigo}`);

      // Buscar el apoderado del alumno
      const apoderado = await this.buscarApoderadoDelAlumno(asistencia.alumno.id_alumno);
      if (!apoderado) {
        this.logger.log(`ℹ️ Alumno ${asistencia.alumno.codigo} no tiene apoderado registrado en Telegram`);
        return;
      }

      // Buscar el chat del apoderado
      const chat = await this.buscarChatDelApoderado(apoderado.id_telegram_user);
      if (!chat) {
        this.logger.log(`ℹ️ Apoderado ${apoderado.first_name} no tiene chat activo`);
        return;
      }

      // Generar mensaje de notificación
      const mensaje = this.generarMensajeAsistencia(asistencia, motivo, tipoOperacion);

      // Enviar notificación
      await this.bot.sendMessage(chat.chat_id, mensaje, { parse_mode: 'HTML' });

      this.logger.log(`✅ Notificación enviada exitosamente a ${apoderado.first_name}`);

    } catch (error) {
      this.logger.error(`❌ Error enviando notificación: ${error.message}`);
    }
  }

  /**
   * Busca el apoderado del alumno en Telegram
   */
  private async buscarApoderadoDelAlumno(idAlumno: string): Promise<TelegramUser | null> {
    try {
      this.logger.log(`🔍 Buscando apoderado para alumno ID: ${idAlumno}`);
      
      // Buscar alumno con apoderados
      const alumno = await this.alumnoRepository.findOne({
        where: { id_alumno: idAlumno },
        relations: ['apoderados'],
      });

      if (!alumno) {
        this.logger.log(`❌ Alumno no encontrado: ${idAlumno}`);
        return null;
      }

      if (!alumno.apoderados || alumno.apoderados.length === 0) {
        this.logger.log(`ℹ️ Alumno ${alumno.codigo} no tiene apoderados asignados`);
        return null;
      }

      this.logger.log(`✅ Alumno ${alumno.codigo} tiene ${alumno.apoderados.length} apoderado(s)`);

      // Buscar si alguno de los apoderados está registrado en Telegram
      // Buscamos por DNI del apoderado en el nombre del usuario (formato: "Apoderado_{DNI}")
      for (const apoderado of alumno.apoderados) {
        if (apoderado.dni) {
          this.logger.log(`🔍 Verificando apoderado con DNI: ${apoderado.dni}`);
          
          // Buscar usuario de Telegram que tenga el DNI en su nombre
          const telegramUser = await this.telegramUserRepository.findOne({
            where: { 
              tipo_usuario: 'APODERADO',
              activo: true,
              first_name: `Apoderado_${apoderado.dni}`
            }
          });

          if (telegramUser) {
            this.logger.log(`✅ Apoderado encontrado en Telegram: ${telegramUser.first_name} (DNI: ${apoderado.dni})`);
            return telegramUser;
          }
        }
      }

      this.logger.log(`ℹ️ Ningún apoderado del alumno ${alumno.codigo} está registrado en Telegram`);
      return null;

    } catch (error) {
      this.logger.error(`❌ Error buscando apoderado: ${error.message}`);
      return null;
    }
  }

  /**
   * Busca el chat activo del apoderado
   */
  private async buscarChatDelApoderado(idTelegramUser: string): Promise<TelegramChat | null> {
    try {
      return await this.telegramChatRepository.findOne({
        where: { 
          id_telegram_user: idTelegramUser,
          activo: true 
        }
      });
    } catch (error) {
      this.logger.error(`❌ Error buscando chat: ${error.message}`);
      return null;
    }
  }

  /**
   * Genera el mensaje de notificación de asistencia
   */
  private generarMensajeAsistencia(
    asistencia: Asistencia, 
    motivo?: string, 
    tipoOperacion?: 'REGISTRO' | 'ACTUALIZACION' | 'ANULACION' | 'JUSTIFICACION'
  ): string {
    const alumno = asistencia.alumno;
    const fecha = new Date(asistencia.fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const hora = asistencia.hora_de_llegada || 'No registrada';
    const estado = this.obtenerEmojiEstado(asistencia.estado_asistencia);
    const estadoTexto = this.obtenerTextoEstado(asistencia.estado_asistencia);

    // Determinar el título y tipo de registro según la operación
    let titulo = '🔄 <b>NOTIFICACIÓN DE ASISTENCIA</b>';
    let tipoRegistro = 'Sistema QR';
    
    if (tipoOperacion) {
      switch (tipoOperacion) {
        case 'ACTUALIZACION':
          titulo = '🔄 <b>ACTUALIZACIÓN DE ASISTENCIA</b>';
          tipoRegistro = 'Sistema de Actualización';
          break;
        case 'ANULACION':
          titulo = '🚫 <b>ANULACIÓN DE ASISTENCIA</b>';
          tipoRegistro = 'Sistema de Anulación';
          break;
        case 'JUSTIFICACION':
          titulo = '📝 <b>JUSTIFICACIÓN DE ASISTENCIA</b>';
          tipoRegistro = 'Sistema de Justificaciones';
          break;
        case 'REGISTRO':
        default:
          titulo = '✅ <b>REGISTRO DE ASISTENCIA</b>';
          tipoRegistro = 'Sistema QR/Manual';
          break;
      }
    } else {
      // Fallback a la lógica anterior
      const esActualizacion = asistencia.hora_salida && asistencia.hora_salida !== '00:00';
      if (esActualizacion) {
        titulo = '🔄 <b>ACTUALIZACIÓN DE ASISTENCIA</b>';
        tipoRegistro = 'Sistema de Actualización';
      }
    }

    return `
${titulo}

👤 <b>ALUMNO:</b> ${alumno.nombre} ${alumno.apellido}
📅 <b>FECHA:</b> ${fecha}
⏰ <b>HORA:</b> ${hora}
${estado} <b>ESTADO:</b> ${estadoTexto}

📋 <b>DETALLES:</b>
• Código: ${alumno.codigo}
• Nivel: ${alumno.nivel || 'No especificado'}
• Grado: ${alumno.grado || 'No especificado'}
• Sección: ${alumno.seccion || 'No especificado'}

${asistencia.alumno.turno ? `🕐 <b>Horario del turno:</b> ${asistencia.alumno.turno.hora_inicio} - ${asistencia.alumno.turno.hora_fin}` : ''}
📍 <b>Registrado por:</b> ${tipoRegistro}
${motivo ? `📝 <b>MOTIVO:</b> ${motivo}` : ''}

---
<i>Sistema de Gestión Académica</i>
    `.trim();
  }

  /**
   * Obtiene el emoji correspondiente al estado de asistencia
   */
  private obtenerEmojiEstado(estado: EstadoAsistencia): string {
    switch (estado) {
      case EstadoAsistencia.PUNTUAL:
        return '✅';
      case EstadoAsistencia.TARDANZA:
        return '⚠️';
      case EstadoAsistencia.AUSENTE:
        return '❌';
      case EstadoAsistencia.JUSTIFICADO:
        return '📝';
      case EstadoAsistencia.ANULADO:
        return '🚫';
      default:
        return '❓';
    }
  }

  /**
   * Obtiene el texto descriptivo del estado de asistencia
   */
  private obtenerTextoEstado(estado: EstadoAsistencia): string {
    switch (estado) {
      case EstadoAsistencia.PUNTUAL:
        return 'PUNTUAL';
      case EstadoAsistencia.TARDANZA:
        return 'TARDANZA';
      case EstadoAsistencia.AUSENTE:
        return 'AUSENTE';
      case EstadoAsistencia.JUSTIFICADO:
        return 'JUSTIFICADO';
      case EstadoAsistencia.ANULADO:
        return 'ANULADO';
      default:
        return 'DESCONOCIDO';
    }
  }

  /**
   * Envía mensaje de bienvenida al usuario
   */
  private async enviarMensajeBienvenida(chatId: number): Promise<void> {
    try {
      const mensaje = `
🎓 <b>¡Bienvenido al Sistema de Gestión Escolar!</b>

👋 Hola, soy tu asistente virtual para el seguimiento académico.

📱 <b>Comandos disponibles:</b>
/start - Mostrar este mensaje de bienvenida
/help - Mostrar ayuda y comandos
/info - Información del sistema
/registro - Registrarse como apoderado
/asistencia - Consultar asistencia de alumnos
/estado - Ver estado de tu cuenta

💡 <b>¿Qué puedo hacer?</b>
• Notificarte sobre la asistencia de tus hijos
• Proporcionar información académica
• Mantenerte informado sobre eventos escolares

🚀 <b>¡Comienza escribiendo /help para ver todas las opciones!</b>
      `;

      await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
      this.logger.log(`✅ Mensaje de bienvenida enviado a chat ${chatId}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando mensaje de bienvenida: ${error.message}`);
    }
  }

  /**
   * Envía mensaje de ayuda con todos los comandos
   */
  private async enviarMensajeAyuda(chatId: number): Promise<void> {
    try {
      const mensaje = `
📚 <b>Comandos de Ayuda</b>

🔹 <b>Comandos básicos:</b>
/start - Mensaje de bienvenida
/help - Mostrar esta ayuda
/info - Información del sistema

🔹 <b>Gestión de apoderados:</b>
/registro - Registrarse como apoderado del sistema
/asistencia - Consultar asistencia de alumnos asignados
/estado - Ver estado de tu cuenta

🔹 <b>Notificaciones automáticas:</b>
• Recibirás notificaciones cuando se registre la asistencia de tus hijos
• Las notificaciones incluyen: fecha, hora, estado de asistencia

💡 <b>Tip:</b> Para recibir notificaciones, primero debes registrarte como apoderado usando /registro

❓ <b>¿Necesitas más ayuda?</b> Contacta al administrador del sistema.
      `;

      await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
      this.logger.log(`✅ Mensaje de ayuda enviado a chat ${chatId}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando mensaje de ayuda: ${error.message}`);
    }
  }

  /**
   * Envía información del sistema
   */
  private async enviarInformacionSistema(chatId: number): Promise<void> {
    try {
      const mensaje = `
🏫 <b>Información del Sistema</b>

📊 <b>Estado:</b> ✅ Activo
🕐 <b>Última actualización:</b> ${new Date().toLocaleString('es-ES')}
🌐 <b>Servidor:</b> Sistema de Gestión Escolar

📱 <b>Funcionalidades:</b>
• Registro automático de asistencia
• Notificaciones en tiempo real
• Gestión de apoderados
• Seguimiento académico

🔒 <b>Seguridad:</b>
• Comunicación encriptada
• Verificación de identidad
• Protección de datos personales

📞 <b>Soporte:</b> Contacta al administrador para asistencia técnica.
      `;

      await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
      this.logger.log(`✅ Información del sistema enviada a chat ${chatId}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando información del sistema: ${error.message}`);
    }
  }

     /**
    * Verifica el estado actual del usuario
    */
   private async verificarEstadoUsuario(chatId: number, user: any): Promise<void> {
     try {
       // Verificar si está registrado en Telegram
       const telegramUser = await this.telegramUserRepository.findOne({
         where: { telegram_id: user.id, activo: true }
       });

       if (!telegramUser) {
         const mensaje = `
❌ <b>No estás registrado</b>

⚠️ Tu cuenta no está activa en el sistema.

💡 <b>Usa el comando:</b>
/registro - Registrarte como apoderado
         `;
         await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
         return;
       }

       // Verificar estado en memoria
       const estadoUsuario = this.usuariosEnRegistro.get(user.id);
       
       if (estadoUsuario) {
         let mensajeEstado = '';
         switch (estadoUsuario.estado) {
           case 'INICIANDO':
             mensajeEstado = '📝 <b>Estado:</b> Registro en proceso - Esperando tu DNI';
             break;
           case 'CONFIRMANDO':
             mensajeEstado = '✅ <b>Estado:</b> Confirmando DNIs de alumnos';
             break;
           case 'CONSULTANDO_ASISTENCIA':
             mensajeEstado = '📊 <b>Estado:</b> Consulta de asistencia en proceso';
             break;
         }
         
         const mensaje = `
📱 <b>ESTADO DE TU CUENTA</b>

✅ <b>Registro:</b> Activo en Telegram
${mensajeEstado}

💡 <b>Comandos disponibles:</b>
/asistencia - Consultar asistencia
/start - Volver al inicio
/help - Ver ayuda
         `;
         await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
       } else {
         const mensaje = `
✅ <b>ESTADO DE TU CUENTA</b>

✅ <b>Registro:</b> Activo en Telegram
✅ <b>Estado:</b> Sin procesos activos

💡 <b>Comandos disponibles:</b>
/asistencia - Consultar asistencia de alumnos
/start - Ver bienvenida
/help - Ver ayuda
/info - Información del sistema
         `;
         await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
       }

     } catch (error) {
       this.logger.error(`❌ Error verificando estado: ${error.message}`);
       await this.bot.sendMessage(chatId, '❌ Error interno del sistema. Intenta nuevamente.');
     }
   }

   /**
    * Inicia el proceso de consulta de asistencia
    */
   private async iniciarConsultaAsistencia(chatId: number, user: any): Promise<void> {
     try {
       // Verificar si el usuario ya está registrado
       const telegramUser = await this.telegramUserRepository.findOne({
         where: { telegram_id: user.id, activo: true }
       });

       if (!telegramUser) {
         const mensaje = `
❌ <b>No estás registrado</b>

⚠️ Para consultar la asistencia de tus alumnos, primero debes registrarte.

💡 <b>Usa el comando:</b>
/registro - Registrarte como apoderado
         `;
         await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
         return;
       }

       // Verificar si ya está en proceso de consulta
       const estadoUsuario = this.usuariosEnRegistro.get(user.id);
       if (estadoUsuario?.estado === 'CONSULTANDO_ASISTENCIA') {
         await this.bot.sendMessage(chatId, '⚠️ Ya tienes una consulta de asistencia en proceso. Envía el DNI, nombre o apellido del alumno.');
         return;
       }

               // Buscar apoderado y sus alumnos
        this.logger.log(`🔍 Buscando apoderado para usuario Telegram ID: ${user.id}`);
        const apoderado = await this.telegramApoderadoService.obtenerApoderadoRegistrado(user.id);
        
        if (!apoderado) {
          this.logger.log(`❌ No se pudo obtener información del apoderado para usuario ${user.id}`);
          const mensaje = `
❌ <b>Error en la consulta</b>

⚠️ No se pudo obtener tu información de apoderado.

💡 <b>Intenta:</b>
/registro - Volver a registrarte
          `;
          await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
          return;
        }

        this.logger.log(`✅ Apoderado encontrado: ${apoderado.nombres} ${apoderado.apellidos} con ${apoderado.alumnos.length} alumnos`);

       // Inicializar estado de consulta
       this.usuariosEnRegistro.set(user.id, {
         estado: 'CONSULTANDO_ASISTENCIA',
         dniApoderado: apoderado.dni,
         apoderado: apoderado
       });

       const mensaje = `
📊 <b>CONSULTA DE ASISTENCIA</b>

👤 <b>Apoderado:</b> ${apoderado.nombres} ${apoderado.apellidos}
👥 <b>Alumnos asignados:</b> ${apoderado.alumnos.length}

${apoderado.alumnos.length === 1 ? 
  `📋 <b>Para ver la asistencia de ${apoderado.alumnos[0].nombres} ${apoderado.alumnos[0].apellidos}, envía:</b>
• Su DNI: ${apoderado.alumnos[0].dni}
• O su nombre: ${apoderado.alumnos[0].nombres}
• O su apellido: ${apoderado.alumnos[0].apellidos}` :
  `📋 <b>Para ver la asistencia de un alumno específico, envía:</b>
• Su DNI (ej: ${apoderado.alumnos[0].dni})
• O su nombre (ej: ${apoderado.alumnos[0].nombres})
• O su apellido (ej: ${apoderado.alumnos[0].apellidos})

💡 <b>Tip:</b> Si solo tienes un alumno, se mostrará automáticamente.`
}

⏳ <b>Estado:</b> Esperando identificación del alumno...
       `;

       await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
       this.logger.log(`✅ Consulta de asistencia iniciada para usuario ${user.id}`);

     } catch (error) {
       this.logger.error(`❌ Error iniciando consulta de asistencia: ${error.message}`);
       await this.bot.sendMessage(chatId, '❌ Error interno del sistema. Intenta nuevamente.');
     }
   }

      /**
    * Inicia el proceso de registro de apoderado
    */
   private async iniciarRegistroApoderado(chatId: number, user: any): Promise<void> {
     try {
       // Verificar si ya está registrado
       const telegramUser = await this.telegramUserRepository.findOne({
         where: { telegram_id: user.id, activo: true }
       });

       if (telegramUser) {
         const mensaje = `
✅ <b>¡Ya estás registrado!</b>

👤 Tu cuenta de apoderado ya está activa en Telegram.

💡 <b>Comandos disponibles:</b>
/asistencia - Consultar asistencia de tus alumnos
/start - Ver bienvenida
/help - Ver ayuda
/info - Información del sistema
         `;
         await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
         return;
       }

       // Verificar si ya está en proceso de registro
       const estadoUsuario = this.usuariosEnRegistro.get(user.id);
       if (estadoUsuario?.estado === 'INICIANDO' || estadoUsuario?.estado === 'CONFIRMANDO') {
         await this.bot.sendMessage(chatId, '⚠️ Ya tienes un registro en proceso. Completa el proceso actual o espera a que termine.');
         return;
       }

       // Inicializar estado de registro
       this.usuariosEnRegistro.set(user.id, { estado: 'INICIANDO' });

      const mensaje = `
📝 <b>REGISTRO DE APODERADO</b>

👋 Hola ${user.first_name}, vamos a registrarte como apoderado.

📋 <b>PASO 1:</b> Envía tu DNI de apoderado
• Solo números (8 dígitos)
• Ejemplo: 12345678

💡 <b>Tip:</b> Este DNI debe estar registrado en el sistema escolar.

⏳ <b>Estado:</b> Esperando tu DNI...
      `;

      await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
      this.logger.log(`✅ Proceso de registro iniciado para usuario ${user.id}`);
    } catch (error) {
      this.logger.error(`❌ Error iniciando registro: ${error.message}`);
    }
  }

  /**
   * Procesa mensajes de texto según el estado del usuario
   */
  private async procesarMensajeTexto(msg: any): Promise<void> {
    try {
      const userId = msg.from.id;
      const chatId = msg.chat.id;
      const texto = msg.text;

      // Verificar si el usuario está en proceso de registro
      const estadoUsuario = this.usuariosEnRegistro.get(userId);

             if (estadoUsuario?.estado === 'INICIANDO') {
         await this.procesarDNIApoderado(userId, chatId, texto);
       } else if (estadoUsuario?.estado === 'CONFIRMANDO') {
         await this.procesarConfirmacionAlumnos(userId, chatId, texto);
       } else if (estadoUsuario?.estado === 'CONSULTANDO_ASISTENCIA') {
         await this.procesarConsultaAsistencia(userId, chatId, texto);
       } else {
         // Usuario no está registrando, enviar respuesta normal
         await this.enviarMensajeRespuesta(chatId);
       }
    } catch (error) {
      this.logger.error(`❌ Error procesando mensaje: ${error.message}`);
    }
  }

  /**
   * Procesa el DNI del apoderado
   */
  private async procesarDNIApoderado(userId: number, chatId: number, dni: string): Promise<void> {
    try {
      // Validar formato del DNI
      if (!/^\d{8}$/.test(dni)) {
        const mensaje = `
❌ <b>DNI Inválido</b>

⚠️ El DNI debe tener exactamente 8 dígitos numéricos.
📝 Ejemplo: 12345678

🔄 <b>Intenta nuevamente:</b>
      `;
        await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
        return;
      }

      // Buscar apoderado en el sistema
      const resultado = await this.telegramApoderadoService.iniciarRegistro(dni);

      if (resultado.success && resultado.apoderado) {
        // Actualizar estado del usuario
        this.usuariosEnRegistro.set(userId, {
          estado: 'CONFIRMANDO',
          dniApoderado: dni,
          apoderado: resultado.apoderado
        });

                 // Mostrar información del apoderado y alumnos
         const mensaje = `
✅ <b>APODERADO ENCONTRADO</b>

👤 <b>Datos del Apoderado:</b>
• DNI: ${resultado.apoderado.dni}
• Nombres: ${resultado.apoderado.nombres}
• Apellidos: ${resultado.apoderado.apellidos}

👥 <b>Alumnos Asignados:</b> ${resultado.apoderado.alumnos.length} alumno(s)

📋 <b>PASO 2:</b> Confirma los DNIs de tus alumnos
• Envía los DNIs separados por comas
• Ejemplo: ${resultado.apoderado.alumnos.map(a => a.dni).join(', ')}

⏳ <b>Estado:</b> Esperando confirmación de DNIs...
       `;

        await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
      } else {
        // Error en el registro
        const mensaje = `
❌ <b>Error en el Registro</b>

⚠️ ${resultado.message}
${resultado.error ? `\n🔍 <b>Detalle:</b> ${resultado.error}` : ''}

🔄 <b>Intenta nuevamente:</b>
• Verifica que tu DNI esté registrado en el sistema
• Contacta al administrador si tienes problemas

💡 <b>Comandos disponibles:</b>
/start - Volver al inicio
/help - Ver ayuda
      `;

        await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
        
        // Limpiar estado del usuario
        this.usuariosEnRegistro.delete(userId);
      }
    } catch (error) {
      this.logger.error(`❌ Error procesando DNI: ${error.message}`);
      await this.bot.sendMessage(chatId, '❌ Error interno del sistema. Intenta nuevamente.');
    }
  }

     /**
    * Procesa la consulta de asistencia
    */
   private async procesarConsultaAsistencia(userId: number, chatId: number, texto: string): Promise<void> {
     try {
       const estadoUsuario = this.usuariosEnRegistro.get(userId);
       if (!estadoUsuario || !estadoUsuario.apoderado) {
         await this.bot.sendMessage(chatId, '❌ Error: Estado de consulta no válido. Usa /asistencia para comenzar.');
         return;
       }

       // Buscar alumno por DNI, nombre o apellido
       const alumnoEncontrado = estadoUsuario.apoderado.alumnos.find(alumno => 
         alumno.dni === texto ||
         alumno.nombres.toLowerCase().includes(texto.toLowerCase()) ||
         alumno.apellidos.toLowerCase().includes(texto.toLowerCase())
       );

       if (!alumnoEncontrado) {
         const mensaje = `
❌ <b>Alumno no encontrado</b>

⚠️ No se encontró ningún alumno con: "${texto}"

📋 <b>Alumnos disponibles:</b>
${estadoUsuario.apoderado.alumnos.map((alumno, index) => 
  `${index + 1}. ${alumno.nombres} ${alumno.apellidos} (DNI: ${alumno.dni})`
).join('\n')}

💡 <b>Intenta con:</b>
• DNI exacto (ej: ${estadoUsuario.apoderado.alumnos[0].dni})
• Nombre (ej: ${estadoUsuario.apoderado.alumnos[0].nombres})
• Apellido (ej: ${estadoUsuario.apoderado.alumnos[0].apellidos})
         `;
         await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
         return;
       }

       // Obtener asistencia del alumno
       this.logger.log(`🔍 Obteniendo asistencia para alumno: ${alumnoEncontrado.nombres} ${alumnoEncontrado.apellidos} (ID: ${alumnoEncontrado.id_alumno})`);
       const asistencia = await this.obtenerAsistenciaAlumno(alumnoEncontrado.id_alumno);
       
       this.logger.log(`📊 Asistencias obtenidas: ${asistencia?.length || 0}`);
       
       if (!asistencia || asistencia.length === 0) {
         const mensaje = `
📊 <b>ASISTENCIA DE ${alumnoEncontrado.nombres.toUpperCase()} ${alumnoEncontrado.apellidos.toUpperCase()}</b>

👤 <b>Alumno:</b> ${alumnoEncontrado.nombres} ${alumnoEncontrado.apellidos}
📝 <b>Código:</b> ${alumnoEncontrado.codigo}
🏫 <b>Nivel:</b> ${alumnoEncontrado.nivel} - Grado ${alumnoEncontrado.grado}° - Sección ${alumnoEncontrado.seccion}

❌ <b>No hay registros de asistencia</b>

💡 <b>Posibles razones:</b>
• El alumno aún no ha asistido a clases
• No se han registrado asistencias en el sistema
• El alumno es nuevo en la institución
         `;
         await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
         return;
       }

       // Mostrar resumen de asistencia
       const resumen = this.generarResumenAsistencia(alumnoEncontrado, asistencia);
       await this.bot.sendMessage(chatId, resumen, { parse_mode: 'HTML' });

       // Limpiar estado del usuario
       this.usuariosEnRegistro.delete(userId);

     } catch (error) {
       this.logger.error(`❌ Error procesando consulta de asistencia: ${error.message}`);
       await this.bot.sendMessage(chatId, '❌ Error interno del sistema. Intenta nuevamente.');
     }
   }

   /**
    * Procesa la confirmación de DNIs de alumnos
    */
   private async procesarConfirmacionAlumnos(userId: number, chatId: number, texto: string): Promise<void> {
    try {
      const estadoUsuario = this.usuariosEnRegistro.get(userId);
      if (!estadoUsuario || !estadoUsuario.apoderado) {
        await this.bot.sendMessage(chatId, '❌ Error: Estado de registro no válido. Usa /registro para comenzar.');
        return;
      }

              // Parsear DNIs de alumnos
        const dniAlumnos = texto.split(',').map(dni => dni.trim()).filter(dni => dni.length > 0);

        if (dniAlumnos.length === 0) {
          await this.bot.sendMessage(chatId, `
❌ <b>Formato Inválido</b>

⚠️ Debes enviar los DNIs de tus alumnos separados por comas.
📝 Ejemplo: ${estadoUsuario.apoderado?.alumnos.map(a => a.dni).join(', ') || 'No disponibles'}

🔄 <b>Intenta nuevamente:</b>
          `, { parse_mode: 'HTML' });
          return;
        }

             // Confirmar registro
       this.logger.log(`🔍 Confirmando registro con datos:`);
       this.logger.log(`   - DNI Apoderado: ${estadoUsuario.dniApoderado}`);
       this.logger.log(`   - DNIs Alumnos: ${dniAlumnos.join(', ')}`);
       
       const resultado = await this.telegramApoderadoService.confirmarRegistro(
         {
           dni_apoderado: estadoUsuario.dniApoderado!,
           dni_alumnos: dniAlumnos
         },
         chatId,
         userId
       );

      if (resultado.success) {
        // Registro exitoso
        const mensaje = `
🎉 <b>¡REGISTRO COMPLETADO EXITOSAMENTE!</b>

✅ Tu cuenta de apoderado ha sido activada en Telegram.

👤 <b>Apoderado:</b> ${estadoUsuario.apoderado?.nombres} ${estadoUsuario.apoderado?.apellidos}
👥 <b>Alumnos:</b> ${estadoUsuario.apoderado?.alumnos.length || 0} asignados

🔔 <b>Notificaciones:</b> Ahora recibirás notificaciones automáticas cuando:
• Se registre la asistencia de tus alumnos
• Se actualice su estado académico
• Se generen reportes importantes

💡 <b>Comandos disponibles:</b>
/start - Ver bienvenida
/help - Ver ayuda
/info - Información del sistema

📱 <b>¡Tu bot está listo para usar!</b>
        `;

        await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
        
        // Limpiar estado del usuario
        this.usuariosEnRegistro.delete(userId);
      } else {
        // Error en la confirmación
        const mensaje = `
❌ <b>Error en la Confirmación</b>

⚠️ ${resultado.message}
${resultado.error ? `\n🔍 <b>Detalle:</b> ${resultado.error}` : ''}

🔄 <b>Intenta nuevamente:</b>
• Verifica que los DNIs sean correctos
• Asegúrate de que coincidan con tus alumnos asignados

📝 <b>DNIs esperados:</b> ${estadoUsuario.apoderado?.alumnos.map(a => a.dni).join(', ') || 'No disponibles'}
        `;

        await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
      }
    } catch (error) {
      this.logger.error(`❌ Error confirmando alumnos: ${error.message}`);
      await this.bot.sendMessage(chatId, '❌ Error interno del sistema. Intenta nuevamente.');
    }
  }

  /**
   * Envía respuesta a mensajes de texto normales
   */
  private async enviarMensajeRespuesta(chatId: number): Promise<void> {
    try {
      const mensaje = `
💬 <b>Mensaje recibido</b>

📝 He recibido tu mensaje. Para interactuar conmigo, usa los comandos disponibles:

🔹 /start - Bienvenida
🔹 /help - Ayuda
🔹 /info - Información del sistema
🔹 /registro - Registrarse como apoderado
🔹 /asistencia - Consultar asistencia
🔹 /estado - Ver estado de cuenta

💡 <b>Tip:</b> Escribe /help para ver todos los comandos disponibles.
      `;

      await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
      this.logger.log(`✅ Respuesta automática enviada a chat ${chatId}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando respuesta automática: ${error.message}`);
    }
  }

     /**
    * Obtiene la asistencia de un alumno específico
    */
   private async obtenerAsistenciaAlumno(idAlumno: string): Promise<Asistencia[]> {
     try {
       this.logger.log(`🔍 Buscando asistencia para alumno ID: ${idAlumno}`);
       
       // Buscar asistencias directamente por ID del alumno usando el repositorio de Asistencia
       const asistenciaRepository = this.alumnoRepository.manager.getRepository(Asistencia);
       
       // Primero intentar sin filtro de fecha para ver si hay asistencias
       const todasLasAsistencias = await asistenciaRepository.find({
         where: { 
           alumno: { id_alumno: idAlumno }
         },
         order: { fecha: 'DESC' },
         relations: ['alumno']
       });
       
       this.logger.log(`📊 Total de asistencias encontradas (sin filtro de fecha): ${todasLasAsistencias.length}`);
       
       if (todasLasAsistencias.length > 0) {
         // Mostrar las primeras 3 fechas para debugging
         const fechasEjemplo = todasLasAsistencias.slice(0, 3).map(a => 
           new Date(a.fecha).toLocaleDateString('es-ES')
         );
         this.logger.log(`📅 Fechas de ejemplo: ${fechasEjemplo.join(', ')}`);
       }
       
       // Filtrar por año actual (más flexible)
       const añoActual = new Date().getFullYear();
       const añoAnterior = añoActual - 1;
       
       this.logger.log(`🔍 Filtrando asistencias de los años: ${añoAnterior} y ${añoActual}`);
       
       const asistenciasFiltradas = todasLasAsistencias.filter(asistencia => {
         const añoAsistencia = new Date(asistencia.fecha).getFullYear();
         return añoAsistencia === añoActual || añoAsistencia === añoAnterior;
       });
       
       this.logger.log(`✅ Asistencias filtradas por año: ${asistenciasFiltradas.length}`);
       
       return asistenciasFiltradas;
       
     } catch (error) {
       this.logger.error(`❌ Error obteniendo asistencia: ${error.message}`);
       this.logger.error(`❌ Stack trace: ${error.stack}`);
       return [];
     }
   }

   /**
    * Genera un resumen de asistencia para un alumno
    */
   private generarResumenAsistencia(alumno: any, asistencias: Asistencia[]): string {
     const totalDias = asistencias.length;
     const puntual = asistencias.filter(a => a.estado_asistencia === 'PUNTUAL').length;
     const tardanza = asistencias.filter(a => a.estado_asistencia === 'TARDANZA').length;
     const ausente = asistencias.filter(a => a.estado_asistencia === 'AUSENTE').length;
     const justificado = asistencias.filter(a => a.estado_asistencia === 'JUSTIFICADO').length;
     const anulado = asistencias.filter(a => a.estado_asistencia === 'ANULADO').length;

     const porcentajeAsistencia = totalDias > 0 ? Math.round(((puntual + tardanza) / totalDias) * 100) : 0;

     const ultimasAsistencias = asistencias.slice(0, 5).map(a => {
       const fecha = new Date(a.fecha).toLocaleDateString('es-ES');
       const estado = this.obtenerEmojiEstado(a.estado_asistencia);
       return `• ${fecha}: ${estado} ${a.estado_asistencia}`;
     }).join('\n');

     return `
📊 <b>RESUMEN DE ASISTENCIA</b>

👤 <b>Alumno:</b> ${alumno.nombres} ${alumno.apellidos}
📝 <b>Código:</b> ${alumno.codigo}
🏫 <b>Nivel:</b> ${alumno.nivel} - Grado ${alumno.grado}° - Sección ${alumno.seccion}

📈 <b>Estadísticas Generales:</b>
• Total de días registrados: ${totalDias}
• Porcentaje de asistencia: ${porcentajeAsistencia}%

📋 <b>Desglose por Estado:</b>
✅ Puntual: ${puntual} días
⚠️ Tardanza: ${tardanza} días
❌ Ausente: ${ausente} días
📝 Justificado: ${justificado} días
🚫 Anulado: ${anulado} días

📅 <b>Últimas 5 Asistencias:</b>
${ultimasAsistencias}

💡 <b>Comandos disponibles:</b>
/asistencia - Consultar otro alumno
/start - Volver al inicio
/help - Ver ayuda
     `.trim();
   }

   /**
    * Método de prueba para verificar si el bot está funcionando
    */
   async testBot(): Promise<{ success: boolean; message: string; botStatus: string }> {
    try {
      console.log('🧪🧪🧪 TESTEANDO EL BOT 🧪🧪🧪');
      
      if (!this.bot) {
        console.log('❌❌❌ BOT NO INICIALIZADO ❌❌❌');
        return {
          success: false,
          message: 'Bot no inicializado',
          botStatus: 'NO_INICIALIZADO'
        };
      }

      console.log('✅✅✅ BOT ESTÁ INICIALIZADO ✅✅✅');
      return {
        success: true,
        message: 'Bot funcionando correctamente',
        botStatus: 'ACTIVO'
      };
    } catch (error) {
      console.log(`❌❌❌ ERROR EN TEST: ${error.message} ❌❌❌`);

      return {
        success: false,
        message: `Error: ${error.message}`,
        botStatus: 'ERROR'
      };
    }
  }
}
