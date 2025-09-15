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
import { TelegramAccountService } from './telegram-account.service';
import { TelegramAuthService } from './telegram-auth.service';
import { PdfGeneratorService } from './pdf-generator.service';

@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);
  private bot: any;
  
     // Estado de registro de usuarios
   private usuariosEnRegistro = new Map<number, {
     estado: 'INICIANDO' | 'CONFIRMANDO' | 'CONSULTANDO_ASISTENCIA' | 'INICIANDO_SESION' | 'CAMBIANDO_CONTRASEÑA' | 'GENERANDO_REPORTE';
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
     timeoutId?: NodeJS.Timeout;
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
    private readonly telegramAccountService: TelegramAccountService,
    private readonly telegramAuthService: TelegramAuthService,
    private readonly pdfGeneratorService: PdfGeneratorService,
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
    // Comando /start - Bienvenida (siempre disponible)
    this.bot.onText(/\/start/, async (msg) => {
      this.logger.log(`📨 Comando /start recibido de ${msg.from?.first_name}`);
      await this.manejarComandoStart(msg.chat.id, msg.from);
    });

    // Comando /entrar - Iniciar sesión (solo si no está autenticado)
    this.bot.onText(/\/entrar/, async (msg) => {
      this.logger.log(`📨 Comando /entrar recibido de ${msg.from?.first_name}`);
      await this.manejarComandoEntrar(msg.chat.id, msg.from);
    });

    // Comando /salir - Cerrar sesión (solo si está autenticado)
    this.bot.onText(/\/salir/, async (msg) => {
      this.logger.log(`📨 Comando /salir recibido de ${msg.from?.first_name}`);
      await this.manejarComandoSalir(msg.chat.id, msg.from);
    });

    // Comando /registro - Registrarse como apoderado (solo si no está autenticado)
    this.bot.onText(/\/registro/, async (msg) => {
      this.logger.log(`📨 Comando /registro recibido de ${msg.from?.first_name}`);
      await this.manejarComandoRegistro(msg.chat.id, msg.from);
    });


    // Comando /consultar - Consultar asistencia del día (solo si está autenticado)
    this.bot.onText(/\/consultar/, async (msg) => {
      this.logger.log(`📨 Comando /consultar recibido de ${msg.from?.first_name}`);
      await this.manejarComandoConsultar(msg.chat.id, msg.from);
    });

    // Comando /estado - Ver estado de notificaciones (solo si está autenticado)
    this.bot.onText(/\/estado/, async (msg) => {
      this.logger.log(`📨 Comando /estado recibido de ${msg.from?.first_name}`);
      await this.manejarComandoEstado(msg.chat.id, msg.from);
    });

    // Comando /contraseña - Cambiar contraseña (solo si está autenticado)
    this.bot.onText(/\/contraseña/, async (msg) => {
      this.logger.log(`📨 Comando /contraseña recibido de ${msg.from?.first_name}`);
      await this.manejarComandoContraseña(msg.chat.id, msg.from);
    });

    // Comando /reporte - Ver reporte general (solo si está autenticado)
    this.bot.onText(/\/reporte/, async (msg) => {
      this.logger.log(`📨 Comando /reporte recibido de ${msg.from?.first_name}`);
      await this.manejarComandoReporte(msg.chat.id, msg.from);
    });

    this.logger.log('📱 Configurando manejador de mensajes generales...');
    // Manejar mensajes de texto normales
    this.bot.on('message', (msg) => {
      if (!msg.text?.startsWith('/')) {
        this.logger.log(`💬 Mensaje recibido de ${msg.from?.first_name}: ${msg.text}`);
        this.procesarMensajeTexto(msg);
      }
    });

    this.logger.log('📱 Configurando manejador de stickers...');
    // Manejar stickers para obtener file_id
    this.bot.on('sticker', (msg) => {
      this.logger.log(`🎭 Sticker recibido de ${msg.from?.first_name}`);
      this.manejarStickerRecibido(msg);
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
      // Buscamos por la relación directa con TelegramAccount
      for (const apoderado of alumno.apoderados) {
        if (apoderado.dni) {
          this.logger.log(`🔍 Verificando apoderado con DNI: ${apoderado.dni}`);
          
          // Buscar cuenta de Telegram del apoderado
          const telegramAccount = await this.telegramAccountService.obtenerCuentaTelegram(apoderado.id_apoderado);
          
          if (telegramAccount) {
            this.logger.log(`✅ Cuenta de Telegram encontrada para apoderado: ${apoderado.nombre} (DNI: ${apoderado.dni})`);
            
            // Buscar el usuario de Telegram activo
            const telegramUser = await this.telegramUserRepository.findOne({
              where: { 
                activo: true,
                sesion_iniciada: true
              }
            });

            if (telegramUser) {
              this.logger.log(`✅ Usuario de Telegram activo encontrado: ${telegramUser.first_name}`);
              return telegramUser;
            }
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
    let tipoRegistro = 'Colegio Andres de los Reyes - Huaral';
    
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

    return `${titulo}

👤 <b>ALUMNO:</b> ${alumno.nombre} ${alumno.apellido}
📅 <b>FECHA:</b> ${fecha}
⏰ <b>HORA:</b> ${hora}
${estado} <b>ESTADO:</b> ${estadoTexto}

📋 <b>DETALLES:</b>
📝 Código: ${alumno.codigo}
🏫 Nivel: ${alumno.nivel || 'No especificado'}
📚 Grado: ${alumno.grado || 'No especificado'}
📖 Sección: ${alumno.seccion || 'No especificado'}

${asistencia.alumno.turno ? `🕐 <b>Horario del turno:</b> ${asistencia.alumno.turno.hora_inicio} - ${asistencia.alumno.turno.hora_fin}` : ''}
📍 <b>Registrado por:</b> ${tipoRegistro}
${motivo ? `📝 <b>MOTIVO:</b> ${motivo}` : ''}

<i>Sistema de control de asistencia I.E.P Andres de los Reyes</i>`;
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
   * Obtiene la descripción del estado de asistencia
   */
  private obtenerDescripcionEstado(estado: EstadoAsistencia): string {
    switch (estado) {
      case EstadoAsistencia.PUNTUAL: 
        return '✅ El alumno llegó a tiempo y asistió normalmente a clases.';
      case EstadoAsistencia.TARDANZA: 
        return '⚠️ El alumno llegó tarde pero asistió a clases.';
      case EstadoAsistencia.AUSENTE: 
        return '❌ El alumno no asistió a clases hoy.';
      case EstadoAsistencia.JUSTIFICADO: 
        return '📝 El alumno no asistió pero tiene una justificación válida.';
      case EstadoAsistencia.ANULADO: 
        return '🚫 Este registro de asistencia ha sido anulado.';
      default: 
        return '❓ Estado de asistencia no reconocido.';
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
      const mensaje = `🎓 <b>𝐁𝐎𝐓 𝐃𝐄 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐂𝐈𝐎𝐍𝐄𝐒</b> 🎓
🏫 <b>𝐈.𝐄.𝐏 𝐀𝐍𝐃𝐑𝐄𝐒 𝐃𝐄 𝐋𝐎𝐒 𝐑𝐄𝐘𝐄𝐒</b> 🏫

👋 <b>¡Hola!</b> Soy tu asistente personal encargado de notificarte sobre la asistencia de tus hijos.

📋 <b>COMANDOS DISPONIBLES</b>

🌟 <code>/start</code> - Mostrar bienvenida
🌟 <code>/help</code> - Mostrar ayuda
🌟 <code>/info</code> - Información del sistema
🌟 <code>/registro</code> - Registrarse como apoderado
🌟 <code>/estado</code> - Ver estado de cuenta

💡 <b>FUNCIONALIDADES</b>

🔔 Notificaciones en tiempo real
📊 Reportes detallados
📋 Consultas de asistencia

🚀 <b>¡Escribe /help para comenzar!</b>`;

      await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
      this.logger.log(`✅ Mensaje de bienvenida enviado a chat ${chatId}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando mensaje de bienvenida: ${error.message}`);
    }
  }

  /**
   * Envía animación/GIF de bienvenida
   */
  private async enviarAnimacionBienvenida(chatId: number): Promise<void> {
    try {
      // URLs de GIFs animados populares para bienvenida
      const animacionesBienvenida = [
        'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', // Celebración
        'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', // Saludo
        'https://media.giphy.com/media/26gspipWnu5Dz5Wly/giphy.gif', // Graduación
        'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', // Cohete
        'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif'  // Estrellas
      ];

      // Seleccionar animación aleatoria
      const animacionAleatoria = animacionesBienvenida[Math.floor(Math.random() * animacionesBienvenida.length)];
      
      // Enviar animación usando sendAnimation
      await this.bot.sendAnimation(chatId, animacionAleatoria, {
        caption: '🎉 ¡Bienvenido! 🎉'
      });
      
      this.logger.log(`✅ Animación de bienvenida enviada a chat ${chatId}`);
    } catch (error) {
      this.logger.warn(`⚠️ No se pudo enviar animación: ${error.message}`);
      // Si falla la animación, enviar emoji animado como respaldo
      await this.enviarEmojiAnimado(chatId);
    }
  }

  /**
   * Envía emoji animado de bienvenida
   */
  private async enviarEmojiAnimado(chatId: number): Promise<void> {
    try {
      // Emojis animados interactivos que se animan al tocarlos
      const emojisAnimados = ['🎉', '👋', '🎓', '🚀', '⭐', '💫', '🌟'];
      
      // Seleccionar emoji aleatorio
      const emojiAleatorio = emojisAnimados[Math.floor(Math.random() * emojisAnimados.length)];
      
      // Enviar emoji animado (se anima automáticamente en Telegram)
      await this.bot.sendMessage(chatId, emojiAleatorio);
      this.logger.log(`✅ Emoji animado ${emojiAleatorio} enviado a chat ${chatId}`);
    } catch (error) {
      this.logger.warn(`⚠️ No se pudo enviar emoji animado: ${error.message}`);
      // Si falla el emoji, continuar con el mensaje normal
    }
  }

  /**
   * Envía efectos especiales con emojis animados
   */
  private async enviarEfectosEspeciales(chatId: number): Promise<void> {
    try {
      // Efectos especiales con emojis que tienen animaciones visuales
      const efectosEspeciales = [
        '✨✨✨', // Chispas múltiples
        '🌟⭐💫', // Estrellas en secuencia
        '🎉🎊🎈', // Celebración completa
        '🚀💫⭐', // Cohete con estrellas
        '🎓✨🌟', // Graduación con efectos
        '👋🎉✨', // Saludo con celebración
        '💫🌟✨', // Efectos de luz
        '🎊🎈🎉'  // Confeti y globos
      ];
      
      // Seleccionar efecto aleatorio
      const efectoAleatorio = efectosEspeciales[Math.floor(Math.random() * efectosEspeciales.length)];
      
      // Enviar efecto especial
      await this.bot.sendMessage(chatId, efectoAleatorio);
      this.logger.log(`✅ Efecto especial ${efectoAleatorio} enviado a chat ${chatId}`);
    } catch (error) {
      this.logger.warn(`⚠️ No se pudo enviar efecto especial: ${error.message}`);
    }
  }

  /**
   * Envía sticker animado de bienvenida (método alternativo)
   */
  private async enviarStickerBienvenida(chatId: number): Promise<void> {
    try {
      // Stickers animados populares de bienvenida (usando stickers públicos de Telegram)
      const stickersBienvenida = [
        'CAACAgIAAxkBAAIBY2Y8QZqJQZqJQZqJQZqJQZqJQZqJ', // Sticker de saludo animado
        'CAACAgIAAxkBAAIBZGY8QZqJQZqJQZqJQZqJQZqJQZqJ', // Sticker de celebración
        'CAACAgIAAxkBAAIBZWY8QZqJQZqJQZqJQZqJQZqJQZqJ', // Sticker de escuela
        'CAACAgIAAxkBAAIBZmY8QZqJQZqJQZqJQZqJQZqJQZqJ', // Sticker de robot
        'CAACAgIAAxkBAAIBZ2Y8QZqJQZqJQZqJQZqJQZqJQZqJ'  // Sticker de notificación
      ];

      // Seleccionar sticker aleatorio
      const stickerAleatorio = stickersBienvenida[Math.floor(Math.random() * stickersBienvenida.length)];
      
      await this.bot.sendSticker(chatId, stickerAleatorio);
      this.logger.log(`✅ Sticker de bienvenida enviado a chat ${chatId}`);
    } catch (error) {
      this.logger.warn(`⚠️ No se pudo enviar sticker de bienvenida: ${error.message}`);
      // Si falla el sticker, continuar con el mensaje normal
    }
  }

  /**
   * Envía mensaje de ayuda con todos los comandos
   */
  private async enviarMensajeAyuda(chatId: number): Promise<void> {
    try {
      const mensaje = `📚 <b>COMANDOS DE AYUDA</b>

🔹 <b>Comandos básicos:</b>
🌟 <code>/start</code> - Mensaje de bienvenida
🌟 <code>/help</code> - Mostrar esta ayuda
🌟 <code>/info</code> - Información del sistema

🔹 <b>Gestión de apoderados:</b>
🌟 <code>/registro</code> - Registrarse como apoderado del sistema
 de alumnos asignados
🌟 <code>/estado</code> - Ver estado de tu cuenta

🔹 <b>Notificaciones automáticas:</b>
🔔 Recibirás notificaciones cuando se registre la asistencia de tus hijos
📊 Las notificaciones incluyen: fecha, hora, estado de asistencia

💡 <b>Tip:</b> Para recibir notificaciones, primero debes registrarte como apoderado usando <code>/registro</code>

❓ <b>¿Necesitas más ayuda?</b> Contacta al administrador del sistema.`;

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
      const mensaje = `🏫 <b>INFORMACIÓN DEL SISTEMA</b>

📊 <b>Estado:</b> ✅ Activo
🕐 <b>Última actualización:</b> ${new Date().toLocaleString('es-ES')}
🌐 <b>Servidor:</b> Sistema de control de asistencia I.E.P Andres de los Reyes

📱 <b>Funcionalidades:</b>
🔔 Registro automático de asistencia
📊 Notificaciones en tiempo real
👥 Gestión de apoderados
📈 Seguimiento académico

🔒 <b>Seguridad:</b>
🔐 Comunicación encriptada
✅ Verificación de identidad
🛡️ Protección de datos personales

📞 <b>Soporte:</b> Contacta al administrador para asistencia técnica.`;

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
         const mensaje = `❌ <b>NO ESTÁS REGISTRADO</b>

⚠️ Tu cuenta no está activa en el sistema.

💡 <b>Usa el comando:</b>
🌟 <code>/registro</code> - Registrarte como apoderado`;
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
         
         const mensaje = `📱 <b>ESTADO DE TU CUENTA</b>

✅ <b>Registro:</b> Activo en Telegram
${mensajeEstado}

💡 <b>Comandos disponibles:</b>
🌟 <code>/start</code> - Volver al inicio
🌟 <code>/help</code> - Ver ayuda`;
         await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
       } else {
         const mensaje = `✅ <b>ESTADO DE TU CUENTA</b>

✅ <b>Registro:</b> Activo en Telegram
✅ <b>Estado:</b> Sin procesos activos

💡 <b>Comandos disponibles:</b>
 de alumnos
🌟 <code>/start</code> - Ver bienvenida
🌟 <code>/help</code> - Ver ayuda
🌟 <code>/info</code> - Información del sistema`;
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
         const mensaje = `❌ <b>NO ESTÁS REGISTRADO</b>

⚠️ Para consultar la asistencia de tus alumnos, primero debes registrarte.

💡 <b>Usa el comando:</b>
🌟 <code>/registro</code> - Registrarte como apoderado`;
         await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
         return;
       }

      // Limpiar cualquier proceso anterior de consulta
      const estadoUsuario = this.usuariosEnRegistro.get(user.id);
      if (estadoUsuario?.estado === 'CONSULTANDO_ASISTENCIA') {
        // Limpiar timeout si existe
        if (estadoUsuario.timeoutId) {
          clearTimeout(estadoUsuario.timeoutId);
        }
        // Limpiar el estado anterior
        this.usuariosEnRegistro.delete(user.id);
        this.logger.log(`🔄 Limpiando proceso anterior de consulta para usuario ${user.id}`);
      }

               // Buscar apoderado y sus alumnos
        this.logger.log(`🔍 Buscando apoderado para usuario Telegram ID: ${user.id}`);
        const apoderado = await this.telegramApoderadoService.obtenerApoderadoRegistrado(user.id);
        
        if (!apoderado) {
          this.logger.log(`❌ No se pudo obtener información del apoderado para usuario ${user.id}`);
          const mensaje = `❌ <b>ERROR EN LA CONSULTA</b>

⚠️ No se pudo obtener tu información de apoderado.

💡 <b>Intenta:</b>
🌟 <code>/registro</code> - Volver a registrarte`;
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

       const mensaje = `📊 <b>CONSULTA DE ASISTENCIA</b>

👤 <b>Apoderado:</b> ${apoderado.nombres} ${apoderado.apellidos}
👥 <b>Alumnos asignados:</b> ${apoderado.alumnos.length}

${apoderado.alumnos.length === 1 ? 
  `📋 <b>Para ver la asistencia de ${apoderado.alumnos[0].nombres} ${apoderado.alumnos[0].apellidos}, envía:</b>
🔢 Su DNI completo
👤 O su nombre: ${apoderado.alumnos[0].nombres}
👤 O su apellido: ${apoderado.alumnos[0].apellidos}` :
  `📋 <b>Para ver la asistencia de un alumno específico, envía:</b>
🔢 Su DNI completo
👤 O su nombre (ej: ${apoderado.alumnos[0].nombres})
👤 O su apellido (ej: ${apoderado.alumnos[0].apellidos})

💡 <b>Tip:</b> Si solo tienes un alumno, se mostrará automáticamente.`
}

⏳ <b>Estado:</b> Esperando identificación del alumno...`;

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
         const mensaje = `✅ <b>¡YA ESTÁS REGISTRADO!</b>

👤 Tu cuenta de apoderado ya está activa en Telegram.

💡 <b>Comandos disponibles:</b>
 de tus alumnos
🌟 <code>/start</code> - Ver bienvenida
🌟 <code>/help</code> - Ver ayuda
🌟 <code>/info</code> - Información del sistema`;
         await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
         return;
       }

      // Limpiar cualquier proceso anterior de registro
      const estadoUsuario = this.usuariosEnRegistro.get(user.id);
      if (estadoUsuario?.estado === 'INICIANDO' || estadoUsuario?.estado === 'CONFIRMANDO') {
        // Limpiar timeout si existe
        if (estadoUsuario.timeoutId) {
          clearTimeout(estadoUsuario.timeoutId);
        }
        // Limpiar el estado anterior
        this.usuariosEnRegistro.delete(user.id);
        this.logger.log(`🔄 Limpiando proceso anterior de registro para usuario ${user.id}`);
      }

       // Inicializar estado de registro
       this.usuariosEnRegistro.set(user.id, { estado: 'INICIANDO' });

      const mensaje = `📝 <b>REGISTRO DE APODERADO</b>

👋 Hola ${user.first_name}, vamos a registrarte como apoderado.

📋 <b>PASO 1:</b> Envía tu DNI de apoderado
🔢 Solo números (8 dígitos)
📝 Ejemplo: 12345678

💡 <b>Tip:</b> Este DNI debe estar registrado en el sistema escolar.

⏳ <b>Estado:</b> Esperando tu DNI...
⏰ <b>Tiempo límite:</b> 20 segundos

⚠️ <b>Importante:</b> Si no envías tu DNI en 20 segundos, la operación se cancelará automáticamente.`;

      await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
      
      // Configurar timeout de 20 segundos
      const timeoutId = setTimeout(async () => {
        await this.cancelarRegistroPorTimeout(user.id, chatId);
      }, 20000); // 20 segundos
      
      // Actualizar el estado con el timeout
      const estadoActual = this.usuariosEnRegistro.get(user.id);
      if (estadoActual) {
        estadoActual.timeoutId = timeoutId;
        this.usuariosEnRegistro.set(user.id, estadoActual);
      }
      
      this.logger.log(`✅ Proceso de registro iniciado para usuario ${user.id} con timeout de 20 segundos`);
    } catch (error) {
      this.logger.error(`❌ Error iniciando registro: ${error.message}`);
    }
  }


  /**
   * Cancela el registro por timeout
   */
  private async cancelarRegistroPorTimeout(userId: number, chatId: number): Promise<void> {
    try {
      const estadoUsuario = this.usuariosEnRegistro.get(userId);
      
      if (estadoUsuario && (estadoUsuario.estado === 'INICIANDO' || estadoUsuario.estado === 'CONFIRMANDO')) {
        // Limpiar el estado del usuario
        this.usuariosEnRegistro.delete(userId);
        
        let mensaje = '';
        if (estadoUsuario.estado === 'INICIANDO') {
          mensaje = `⏰ <b>REGISTRO CANCELADO POR TIMEOUT</b>

⚠️ No se recibió tu DNI en el tiempo límite de 20 segundos.

🔄 <b>Para intentar nuevamente:</b>
🌟 <code>/registro</code> - Iniciar nuevo registro`;
        } else if (estadoUsuario.estado === 'CONFIRMANDO') {
          mensaje = `⏰ <b>REGISTRO CANCELADO POR TIMEOUT</b>

⚠️ No se recibieron los DNIs de tus alumnos en el tiempo límite de 20 segundos.

🔄 <b>Para intentar nuevamente:</b>
🌟 <code>/registro</code> - Iniciar nuevo registro`;
        }
        
        mensaje += `

💡 <b>Comandos disponibles:</b>
🌟 <code>/start</code> - Ver bienvenida
🌟 <code>/help</code> - Ver ayuda
🌟 <code>/info</code> - Información del sistema`;

        await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
        this.logger.log(`⏰ Registro cancelado por timeout para usuario ${userId} en estado ${estadoUsuario.estado}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error cancelando registro por timeout: ${error.message}`);
    }
  }



  /**
   * Elimina la relación entre apoderado y alumnos
   */
  private async eliminarRelacionApoderadoAlumnos(dniApoderado: string): Promise<void> {
    try {
      this.logger.log(`🗑️ Eliminando relación para apoderado DNI: ${dniApoderado}`);
      
      // Buscar el apoderado con sus relaciones
      const apoderado = await this.alumnoRepository.manager
        .getRepository('Apoderado')
        .findOne({
          where: { dni: dniApoderado },
          relations: ['pupilos']
        });

      if (apoderado && apoderado.pupilos) {
        // Eliminar todas las relaciones de pupilos
        for (const pupilo of apoderado.pupilos) {
          await this.alumnoRepository.manager
            .getRepository('Pupilo')
            .delete({ 
              id_apoderado: apoderado.id_apoderado,
              dni_alumno: pupilo.dni_alumno
            });
        }
        
        this.logger.log(`✅ Relaciones eliminadas para apoderado ${dniApoderado}: ${apoderado.pupilos.length} alumnos`);
      } else {
        this.logger.log(`⚠️ No se encontraron relaciones para apoderado ${dniApoderado}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error eliminando relación apoderado-alumnos: ${error.message}`);
      throw error;
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
       } else if (estadoUsuario?.estado === 'INICIANDO_SESION') {
         await this.procesarInicioSesion(userId, chatId, texto);
       } else if (estadoUsuario?.estado === 'CAMBIANDO_CONTRASEÑA') {
         await this.procesarCambioContraseña(userId, chatId, texto);
       } else if (estadoUsuario?.estado === 'GENERANDO_REPORTE') {
         await this.procesarGeneracionReporte(userId, chatId, texto);
       } else {
         // Usuario no está en ningún proceso, enviar respuesta normal
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
      // Limpiar timeout si existe
      const estadoUsuario = this.usuariosEnRegistro.get(userId);
      if (estadoUsuario?.timeoutId) {
        clearTimeout(estadoUsuario.timeoutId);
        delete estadoUsuario.timeoutId;
      }
      
      // Validar formato del DNI
      if (!/^\d{8}$/.test(dni)) {
        const mensaje = `❌ <b>DNI INVÁLIDO</b>

⚠️ El DNI debe tener exactamente 8 dígitos numéricos.
📝 Ejemplo: 12345678

🔄 <b>Intenta nuevamente:</b>`;
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
         const mensaje = `✅ <b>APODERADO ENCONTRADO</b>

👤 <b>Datos del Apoderado:</b>
🔢 DNI: ${resultado.apoderado.dni}
👤 Nombres: ${resultado.apoderado.nombres}
👤 Apellidos: ${resultado.apoderado.apellidos}

👥 <b>Alumnos Asignados:</b> ${resultado.apoderado.alumnos.length} alumno(s)

📋 <b>PASO 2:</b> Confirma los DNIs de tus alumnos
🔢 Envía los DNIs separados por comas
📝 Ejemplo: 12345678, 87654321

⏳ <b>Estado:</b> Esperando confirmación de DNIs...
⏰ <b>Tiempo límite:</b> 20 segundos

⚠️ <b>Importante:</b> Si no envías los DNIs en 20 segundos, la operación se cancelará automáticamente.`;

        await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
        
        // Configurar timeout de 20 segundos para confirmación
        const timeoutId = setTimeout(async () => {
          await this.cancelarRegistroPorTimeout(userId, chatId);
        }, 20000); // 20 segundos
        
        // Actualizar el estado con el timeout
        const estadoActual = this.usuariosEnRegistro.get(userId);
        if (estadoActual) {
          estadoActual.timeoutId = timeoutId;
          this.usuariosEnRegistro.set(userId, estadoActual);
        }
      } else {
        // Error en el registro
        const mensaje = `❌ <b>ERROR EN EL REGISTRO</b>

⚠️ ${resultado.message}
${resultado.error ? `\n🔍 <b>Detalle:</b> ${resultado.error}` : ''}

🔄 <b>Intenta nuevamente:</b>
✅ Verifica que tu DNI esté registrado en el sistema
📞 Contacta al administrador si tienes problemas

💡 <b>Comandos disponibles:</b>
🌟 <code>/start</code> - Volver al inicio
🌟 <code>/help</code> - Ver ayuda`;

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
         await this.bot.sendMessage(chatId, '❌ Error: Estado de consulta no válido. Usa /consultar para comenzar.');
         return;
       }

       // Limpiar timeout si existe (antes de procesar la consulta)
       if (estadoUsuario.timeoutId) {
         clearTimeout(estadoUsuario.timeoutId);
         delete estadoUsuario.timeoutId;
         this.logger.log(`🔄 Timeout limpiado para usuario ${userId} en consulta de asistencia`);
       }

       // Buscar alumno por DNI, nombre o apellido
       const alumnoEncontrado = estadoUsuario.apoderado.alumnos.find(alumno => 
         alumno.dni === texto ||
         alumno.nombres.toLowerCase().includes(texto.toLowerCase()) ||
         alumno.apellidos.toLowerCase().includes(texto.toLowerCase())
       );

       if (!alumnoEncontrado) {
         const mensaje = `❌ <b>ALUMNO NO ENCONTRADO</b>

⚠️ No se encontró ningún alumno con: "${texto}"

📋 <b>Alumnos disponibles:</b>
${estadoUsuario.apoderado.alumnos.map((alumno, index) => 
  `${index + 1}. ${alumno.nombres} ${alumno.apellidos} (DNI: ${alumno.dni})`
).join('\n')}

💡 <b>Intenta con:</b>
🔢 DNI exacto (ej: 12345678)
👤 Nombre (ej: ${estadoUsuario.apoderado.alumnos[0].nombres})
👤 Apellido (ej: ${estadoUsuario.apoderado.alumnos[0].apellidos})`;
         await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
         
         // No limpiar el estado aquí, permitir que el usuario intente nuevamente
         // pero sí limpiar el timeout para evitar mensajes de timeout
         if (estadoUsuario.timeoutId) {
           clearTimeout(estadoUsuario.timeoutId);
           delete estadoUsuario.timeoutId;
         }
         return;
       }

       // Obtener asistencia del alumno (solo del día actual para /consultar)
       this.logger.log(`🔍 Obteniendo asistencia para alumno: ${alumnoEncontrado.nombres} ${alumnoEncontrado.apellidos} (ID: ${alumnoEncontrado.id_alumno})`);
       const asistencia = await this.obtenerAsistenciaAlumno(alumnoEncontrado.id_alumno, true);
       
       this.logger.log(`📊 Asistencias obtenidas: ${asistencia?.length || 0}`);
       
       if (!asistencia || asistencia.length === 0) {
         const mensaje = `📊 <b>REPORTE DE ASISTENCIA</b>

👨‍👩‍👧‍👦 <b>Estimado(a) padre/madre de familia:</b>

👶 <b>INFORMACIÓN DEL ALUMNO</b>
👤 <b>Nombre completo:</b> ${alumnoEncontrado.nombres} ${alumnoEncontrado.apellidos}
📝 <b>Código estudiantil:</b> ${alumnoEncontrado.codigo}
🏫 <b>Nivel educativo:</b> ${alumnoEncontrado.nivel}
📚 <b>Grado y sección:</b> ${alumnoEncontrado.grado}° ${alumnoEncontrado.seccion}

📊 <b>ESTADO DE ASISTENCIA</b>
❌ <b>No hay registros de asistencia disponibles</b>

💡 <b>POSIBLES RAZONES:</b>
📚 El alumno aún no ha asistido a clases
📋 No se han registrado asistencias en el sistema
🆕 El alumno es nuevo en la institución
📅 Las asistencias se registran a partir de hoy

💡 <b>COMANDOS DISPONIBLES</b>
🌟 <code>/start</code> - Volver al inicio
🌟 <code>/help</code> - Ver ayuda

🏫 <i>Institucion Educativa Publica "Andrés de los Reyes"</i>`;
         await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
         
         // Limpiar estado del usuario después de mostrar el resultado
         this.usuariosEnRegistro.delete(userId);
         return;
       }

      // Mostrar resumen de asistencia del día actual
      const resumen = this.generarResumenAsistenciaDia(alumnoEncontrado, asistencia);
      await this.bot.sendMessage(chatId, resumen, { parse_mode: 'HTML' });

      // Limpiar estado del usuario
      this.usuariosEnRegistro.delete(userId);

     } catch (error) {
       this.logger.error(`❌ Error procesando consulta de asistencia: ${error.message}`);
       await this.bot.sendMessage(chatId, '❌ Error interno del sistema. Intenta nuevamente.');
     }
   }

   /**
    * Procesa la generación de reporte PDF
    */
   private async procesarGeneracionReporte(userId: number, chatId: number, texto: string): Promise<void> {
     try {
       const estadoUsuario = this.usuariosEnRegistro.get(userId);
       if (!estadoUsuario || !estadoUsuario.apoderado) {
         await this.bot.sendMessage(chatId, '❌ Error: Estado de reporte no válido. Usa /reporte para comenzar.');
         return;
       }

       // Limpiar timeout si existe (antes de procesar el reporte)
       if (estadoUsuario.timeoutId) {
         clearTimeout(estadoUsuario.timeoutId);
         delete estadoUsuario.timeoutId;
         this.logger.log(`🔄 Timeout limpiado para usuario ${userId} en generación de reporte`);
       }

       // Buscar alumno por DNI, nombre o apellido
       const alumnoEncontrado = estadoUsuario.apoderado.alumnos.find(alumno => 
         alumno.dni === texto ||
         alumno.nombres.toLowerCase().includes(texto.toLowerCase()) ||
         alumno.apellidos.toLowerCase().includes(texto.toLowerCase())
       );

       if (!alumnoEncontrado) {
         const mensaje = `❌ <b>ALUMNO NO ENCONTRADO</b>

⚠️ No se encontró ningún alumno con: "${texto}"

📋 <b>Alumnos disponibles:</b>
${estadoUsuario.apoderado.alumnos.map((alumno, index) => 
  `${index + 1}. 👶 ${alumno.nombres} ${alumno.apellidos} (DNI: ${alumno.dni})`
).join('\n')}

💡 <b>Intenta con:</b>
🔢 DNI exacto (ej: 12345678)
👤 Nombre (ej: ${estadoUsuario.apoderado.alumnos[0].nombres})
👤 Apellido (ej: ${estadoUsuario.apoderado.alumnos[0].apellidos})`;
         await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
         
         // No limpiar el estado aquí, permitir que el usuario intente nuevamente
         // pero sí limpiar el timeout para evitar mensajes de timeout
         if (estadoUsuario.timeoutId) {
           clearTimeout(estadoUsuario.timeoutId);
           delete estadoUsuario.timeoutId;
         }
         return;
       }

       // Enviar mensaje de procesamiento
       await this.bot.sendMessage(chatId, `📄 <b>GENERANDO REPORTE PDF</b>

👶 <b>Alumno:</b> ${alumnoEncontrado.nombres} ${alumnoEncontrado.apellidos}
📊 <b>Procesando asistencia general...</b>

⏳ Por favor espere, esto puede tomar unos segundos.`, { parse_mode: 'HTML' });

       // Obtener asistencia general del alumno (sin filtro de fecha)
       this.logger.log(`🔍 Obteniendo asistencia general para reporte: ${alumnoEncontrado.nombres} ${alumnoEncontrado.apellidos} (ID: ${alumnoEncontrado.id_alumno})`);
       const asistencia = await this.obtenerAsistenciaAlumno(alumnoEncontrado.id_alumno, false);
       
       this.logger.log(`📊 Asistencias obtenidas para reporte: ${asistencia?.length || 0}`);
       
       // Debug: Mostrar las primeras 5 asistencias para verificar que son del alumno correcto
       if (asistencia && asistencia.length > 0) {
         this.logger.log(`🔍 DEBUG - Primeras 5 asistencias del reporte:`);
         asistencia.slice(0, 5).forEach((a, index) => {
           this.logger.log(`  ${index + 1}. Fecha: ${new Date(a.fecha).toLocaleDateString('es-ES')}, Estado: ${a.estado_asistencia}, Alumno ID: ${a.alumno?.id_alumno || 'N/A'}`);
         });
       }

       if (!asistencia || asistencia.length === 0) {
         const mensaje = `📊 <b>REPORTE DE ASISTENCIA</b>

👨‍👩‍👧‍👦 <b>Estimado(a) padre/madre de familia:</b>

👶 <b>INFORMACIÓN DEL ALUMNO</b>
👤 <b>Nombre completo:</b> ${alumnoEncontrado.nombres} ${alumnoEncontrado.apellidos}
📝 <b>Código estudiantil:</b> ${alumnoEncontrado.codigo}
🏫 <b>Nivel educativo:</b> ${alumnoEncontrado.nivel}
📚 <b>Grado y sección:</b> ${alumnoEncontrado.grado}° ${alumnoEncontrado.seccion}

📊 <b>ESTADO DE ASISTENCIA</b>
❌ <b>No hay registros de asistencia disponibles</b>

💡 <b>POSIBLES RAZONES:</b>
📚 El alumno aún no ha asistido a clases
📋 No se han registrado asistencias en el sistema
🆕 El alumno es nuevo en la institución

💡 <b>COMANDOS DISPONIBLES</b>
🌟 <code>/reporte</code> - Generar reporte de otro alumno
🌟 <code>/consultar</code> - Consultar asistencia del día
🌟 <code>/estado</code> - Ver estado de su cuenta

🏫 <i>Institucion Educativa Publica "Andrés de los Reyes"</i>`;
         await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
         
         // Limpiar estado del usuario después de mostrar el resultado
         this.usuariosEnRegistro.delete(userId);
         return;
       }

       // Generar PDF
       try {
         this.logger.log(`📄 Generando PDF para alumno: ${alumnoEncontrado.nombres} ${alumnoEncontrado.apellidos}`);
         const pdfPath = await this.pdfGeneratorService.generarReporteAsistencia(alumnoEncontrado, asistencia);
         
         // Enviar el PDF al usuario
         await this.bot.sendDocument(chatId, pdfPath, {
           caption: `📄 <b>REPORTE DE ASISTENCIA GENERADO</b>

👶 <b>Alumno:</b> ${alumnoEncontrado.nombres} ${alumnoEncontrado.apellidos}
📊 <b>Total de registros:</b> ${asistencia.length} días
📅 <b>Fecha de generación:</b> ${new Date().toLocaleDateString('es-ES')}

✅ <b>El reporte PDF ha sido generado exitosamente</b>

💡 <b>COMANDOS DISPONIBLES</b>
🌟 <code>/reporte</code> - Generar reporte de otro alumno
🌟 <code>/consultar</code> - Consultar asistencia del día
🌟 <code>/estado</code> - Ver estado de su cuenta

🏫 <i>Institucion Educativa Publica "Andrés de los Reyes"</i>`,
           parse_mode: 'HTML'
         });

         this.logger.log(`✅ PDF enviado exitosamente: ${pdfPath}`);

       } catch (pdfError) {
         this.logger.error(`❌ Error generando PDF: ${pdfError.message}`);
         await this.bot.sendMessage(chatId, `❌ <b>ERROR AL GENERAR PDF</b>

⚠️ No se pudo generar el reporte PDF.

💡 <b>Intenta:</b>
🌟 <code>/reporte</code> - Generar reporte nuevamente
🌟 <code>/consultar</code> - Consultar asistencia del día

🏫 <i>Institucion Educativa Publica "Andrés de los Reyes"</i>`, { parse_mode: 'HTML' });
       }

       // Limpiar estado del usuario
       this.usuariosEnRegistro.delete(userId);

     } catch (error) {
       this.logger.error(`❌ Error procesando generación de reporte: ${error.message}`);
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
      
      // Limpiar timeout si existe
      if (estadoUsuario.timeoutId) {
        clearTimeout(estadoUsuario.timeoutId);
        delete estadoUsuario.timeoutId;
      }

              // Parsear DNIs de alumnos
        const dniAlumnos = texto.split(',').map(dni => dni.trim()).filter(dni => dni.length > 0);

        if (dniAlumnos.length === 0) {
          await this.bot.sendMessage(chatId, `❌ <b>FORMATO INVÁLIDO</b>

⚠️ Debes enviar los DNIs de tus alumnos separados por comas.
📝 Ejemplo: 12345678, 87654321

🔄 <b>Intenta nuevamente:</b>`, { parse_mode: 'HTML' });
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
        const alumnosLista = estadoUsuario.apoderado?.alumnos.map((alumno, index) => 
          `${index + 1}. 👶 ${alumno.nombres} ${alumno.apellidos} (${alumno.nivel} - ${alumno.grado}° ${alumno.seccion})`
        ).join('\n') || 'No hay alumnos asignados';

        let mensaje = `🎉 <b>¡REGISTRO COMPLETADO EXITOSAMENTE!</b>

👨‍👩‍👧‍👦 <b>Estimado(a) padre/madre de familia:</b>

✅ Su cuenta de apoderado ha sido activada correctamente en nuestro sistema de notificaciones.

👤 <b>Apoderado registrado:</b> ${estadoUsuario.apoderado?.nombres} ${estadoUsuario.apoderado?.apellidos}

👶 <b>Sus hijos(as) asignados:</b>
${alumnosLista}`;

        // Agregar información de la cuenta de Telegram si se creó exitosamente
        if (resultado.telegramAccount) {
          mensaje += `

🔐 <b>CUENTA DE TELEGRAM CREADA</b>
👤 <b>Usuario:</b> <code>${resultado.telegramAccount.username}</code>
🔑 <b>Contraseña:</b> <code>${resultado.telegramAccount.password}</code>

⚠️ <b>IMPORTANTE:</b> Guarde estas credenciales en un lugar seguro. Las necesitará para acceder a su cuenta de Telegram.`;
        }

        mensaje += `

🔔 <b>Notificaciones que recibirá:</b>
📊 Cuando se registre la asistencia de sus hijos
⏰ Hora de llegada y estado (puntual, tardanza, ausente)
📈 Actualizaciones del estado académico
📋 Reportes importantes de la institución

💡 <b>Comandos disponibles:</b>
🌟 <code>/start</code> - Ver bienvenida
🌟 <code>/help</code> - Ver ayuda
 de sus hijos
🌟 <code>/estado</code> - Ver estado de su cuenta

📱 <b>¡Su bot está listo para mantenerlo informado sobre sus hijos!</b>

🏫 <i>Institucion Educativa Publica "Andrés de los Reyes"</i>`;

        await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
        
        // Limpiar estado del usuario
        this.usuariosEnRegistro.delete(userId);
      } else {
        // Error en la confirmación
        const mensaje = `❌ <b>ERROR EN LA CONFIRMACIÓN</b>

⚠️ ${resultado.message}
${resultado.error ? `\n🔍 <b>Detalle:</b> ${resultado.error}` : ''}

🔄 <b>Intenta nuevamente:</b>
✅ Verifica que los DNIs sean correctos
✅ Asegúrate de que coincidan con tus alumnos asignados

📝 <b>DNIs esperados:</b> ${estadoUsuario.apoderado?.alumnos.length || 0} DNI(s) de tus alumnos asignados`;

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
      const mensaje = `💬 <b>MENSAJE RECIBIDO</b>

📝 He recibido tu mensaje. Para interactuar conmigo, usa los comandos disponibles:

🔹 <code>/start</code> - Bienvenida
🔹 <code>/help</code> - Ayuda
🔹 <code>/info</code> - Información del sistema
🔹 <code>/registro</code> - Registrarse como apoderado
🔹 <code>/estado</code> - Ver estado de cuenta

💡 <b>Tip:</b> Escribe <code>/help</code> para ver todos los comandos disponibles.`;

      await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
      this.logger.log(`✅ Respuesta automática enviada a chat ${chatId}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando respuesta automática: ${error.message}`);
    }
  }

     /**
    * Obtiene la asistencia de un alumno específico
    */
   private async obtenerAsistenciaAlumno(idAlumno: string, soloHoy: boolean = false): Promise<Asistencia[]> {
     try {
       this.logger.log(`🔍 Buscando asistencia para alumno ID: ${idAlumno}${soloHoy ? ' (solo hoy)' : ''}`);
       
       // Buscar asistencias directamente por ID del alumno usando el repositorio de Asistencia
       const asistenciaRepository = this.alumnoRepository.manager.getRepository(Asistencia);
       
       if (soloHoy) {
         // Filtrar solo por el día actual
         const hoy = new Date();
         const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
         const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
         
         this.logger.log(`📅 Buscando asistencia del día: ${inicioDia.toLocaleDateString('es-ES')}`);
         
         const asistenciasHoy = await asistenciaRepository
           .createQueryBuilder('asistencia')
           .leftJoinAndSelect('asistencia.alumno', 'alumno')
           .where('alumno.id_alumno = :idAlumno', { idAlumno })
           .andWhere('asistencia.fecha >= :inicioDia', { inicioDia })
           .andWhere('asistencia.fecha < :finDia', { finDia })
           .orderBy('asistencia.fecha', 'DESC')
           .getMany();
         
         this.logger.log(`📊 Asistencias encontradas para hoy: ${asistenciasHoy.length}`);
         return asistenciasHoy;
       }
       
       // Buscar asistencias del alumno específico usando createQueryBuilder para ser más explícito
       const todasLasAsistencias = await asistenciaRepository
         .createQueryBuilder('asistencia')
         .leftJoinAndSelect('asistencia.alumno', 'alumno')
         .where('alumno.id_alumno = :idAlumno', { idAlumno })
         .orderBy('asistencia.fecha', 'DESC')
         .getMany();
       
       this.logger.log(`📊 Total de asistencias encontradas (sin filtro de fecha): ${todasLasAsistencias.length}`);
       
       if (todasLasAsistencias.length > 0) {
         // Mostrar las primeras 3 fechas para debugging
         const fechasEjemplo = todasLasAsistencias.slice(0, 3).map(a => 
           new Date(a.fecha).toLocaleDateString('es-ES')
         );
         this.logger.log(`📅 Fechas de ejemplo: ${fechasEjemplo.join(', ')}`);
         
         // Verificar que todas las asistencias son del alumno correcto
         const alumnosUnicos = [...new Set(todasLasAsistencias.map(a => a.alumno?.id_alumno))];
         this.logger.log(`🔍 IDs de alumnos únicos en las asistencias: ${alumnosUnicos.join(', ')}`);
         this.logger.log(`🎯 ID del alumno buscado: ${idAlumno}`);
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
    * Genera un resumen de asistencia del día actual para un alumno
    */
   private generarResumenAsistenciaDia(alumno: any, asistencias: Asistencia[]): string {
     const hoy = new Date().toLocaleDateString('es-ES');
     
     if (!asistencias || asistencias.length === 0) {
       return `📊 <b>ASISTENCIA DEL DÍA</b>

👨‍👩‍👧‍👦 <b>Estimado(a) padre/madre de familia:</b>

👶 <b>INFORMACIÓN DEL ALUMNO</b>
👤 <b>Nombre completo:</b> ${alumno.nombres} ${alumno.apellidos}
📝 <b>Código estudiantil:</b> ${alumno.codigo}
🏫 <b>Nivel educativo:</b> ${alumno.nivel}
📚 <b>Grado y sección:</b> ${alumno.grado}° ${alumno.seccion}

📅 <b>ASISTENCIA DEL DÍA: ${hoy}</b>
❌ <b>No hay registro de asistencia para hoy</b>

💡 <b>POSIBLES RAZONES:</b>
📚 El alumno no asistió a clases hoy
📋 Aún no se ha registrado la asistencia del día
🕐 La asistencia se registra durante el horario escolar
📅 Es posible que sea un día no lectivo

💡 <b>COMANDOS DISPONIBLES</b>
🌟 <code>/consultar</code> - Consultar otro alumno
🌟 <code>/reporte</code> - Ver reporte general de asistencia
🌟 <code>/estado</code> - Ver estado de su cuenta

🏫 <i>Institucion Educativa Publica "Andrés de los Reyes"</i>`;
     }

     const asistenciaHoy = asistencias[0]; // La más reciente del día
     const estado = this.obtenerEmojiEstado(asistenciaHoy.estado_asistencia);
     const hora = new Date(asistenciaHoy.fecha).toLocaleTimeString('es-ES', { 
       hour: '2-digit', 
       minute: '2-digit' 
     });

     return `📊 <b>ASISTENCIA DEL DÍA</b>

👨‍👩‍👧‍👦 <b>Estimado(a) padre/madre de familia:</b>

👶 <b>INFORMACIÓN DEL ALUMNO</b>
👤 <b>Nombre completo:</b> ${alumno.nombres} ${alumno.apellidos}
📝 <b>Código estudiantil:</b> ${alumno.codigo}
🏫 <b>Nivel educativo:</b> ${alumno.nivel}
📚 <b>Grado y sección:</b> ${alumno.grado}° ${alumno.seccion}

📅 <b>ASISTENCIA DEL DÍA: ${hoy}</b>
${estado} <b>Estado:</b> ${asistenciaHoy.estado_asistencia}
🕐 <b>Hora de registro:</b> ${hora}

💡 <b>DESCRIPCIÓN DEL ESTADO:</b>
${this.obtenerDescripcionEstado(asistenciaHoy.estado_asistencia)}

💡 <b>COMANDOS DISPONIBLES</b>
🌟 <code>/consultar</code> - Consultar otro alumno
🌟 <code>/reporte</code> - Ver reporte general de asistencia
🌟 <code>/estado</code> - Ver estado de su cuenta

🏫 <i>Institucion Educativa Publica "Andrés de los Reyes"</i>`;
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

     // Determinar el estado general de asistencia
     let estadoGeneral = '';
     let emojiEstado = '';
     if (porcentajeAsistencia >= 90) {
       estadoGeneral = 'EXCELENTE';
       emojiEstado = '🏆';
     } else if (porcentajeAsistencia >= 80) {
       estadoGeneral = 'BUENO';
       emojiEstado = '👍';
     } else if (porcentajeAsistencia >= 70) {
       estadoGeneral = 'REGULAR';
       emojiEstado = '⚠️';
     } else {
       estadoGeneral = 'NECESITA MEJORAR';
       emojiEstado = '📉';
     }

     return `📊 <b>REPORTE DE ASISTENCIA</b>

👨‍👩‍👧‍👦 <b>Estimado(a) padre/madre de familia:</b>

👶 <b>INFORMACIÓN DEL ALUMNO</b>
👤 <b>Nombre completo:</b> ${alumno.nombres} ${alumno.apellidos}
📝 <b>Código estudiantil:</b> ${alumno.codigo}
🏫 <b>Nivel educativo:</b> ${alumno.nivel}
📚 <b>Grado y sección:</b> ${alumno.grado}° ${alumno.seccion}

📈 <b>ESTADÍSTICAS GENERALES</b>
📊 <b>Total de días registrados:</b> ${totalDias} días
📈 <b>Porcentaje de asistencia:</b> ${porcentajeAsistencia}%
${emojiEstado} <b>Estado general:</b> ${estadoGeneral}

📋 <b>DESGLOSE DETALLADO POR ESTADO</b>
✅ <b>Puntual:</b> ${puntual} días (${totalDias > 0 ? Math.round((puntual/totalDias)*100) : 0}%)
⚠️ <b>Tardanza:</b> ${tardanza} días (${totalDias > 0 ? Math.round((tardanza/totalDias)*100) : 0}%)
❌ <b>Ausente:</b> ${ausente} días (${totalDias > 0 ? Math.round((ausente/totalDias)*100) : 0}%)
📝 <b>Justificado:</b> ${justificado} días (${totalDias > 0 ? Math.round((justificado/totalDias)*100) : 0}%)
🚫 <b>Anulado:</b> ${anulado} días (${totalDias > 0 ? Math.round((anulado/totalDias)*100) : 0}%)

📅 <b>ÚLTIMAS 5 ASISTENCIAS REGISTRADAS</b>
${ultimasAsistencias}

💡 <b>COMANDOS DISPONIBLES</b>
🌟 <code>/start</code> - Volver al inicio
🌟 <code>/help</code> - Ver ayuda

🏫 <i>Institucion Educativa Publica "Andrés de los Reyes"</i>`;
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

  /**
   * Maneja stickers recibidos para obtener file_id
   */
  private async manejarStickerRecibido(msg: any): Promise<void> {
    try {
      const sticker = msg.sticker;
      const fileId = sticker.file_id;
      const emoji = sticker.emoji;
      const setName = sticker.set_name;
      
      this.logger.log(`🎭 Sticker recibido:`);
      this.logger.log(`   📁 File ID: ${fileId}`);
      this.logger.log(`   😀 Emoji: ${emoji}`);
      this.logger.log(`   📦 Set: ${setName}`);
      
      // Enviar información del sticker al usuario
      const respuesta = `🎭 <b>STICKER RECIBIDO!</b>

📁 <b>File ID:</b> <code>${fileId}</code>
😀 <b>Emoji:</b> ${emoji}
📦 <b>Set:</b> ${setName}

💡 <b>Para usar este sticker en el bot:</b>
Copia el File ID y reemplázalo en el código del bot.`;

      await this.bot.sendMessage(msg.chat.id, respuesta, { parse_mode: 'HTML' });
      
    } catch (error) {
      this.logger.error(`❌ Error manejando sticker: ${error.message}`);
    }
  }

  // ==================== NUEVOS MÉTODOS DE AUTENTICACIÓN ====================

  /**
   * Maneja el comando /start según el estado de autenticación
   */
  private async manejarComandoStart(chatId: number, user: any): Promise<void> {
    try {
      const tieneSesion = await this.telegramAuthService.tieneSesionIniciada(user.id);
      
      if (tieneSesion) {
        // Usuario autenticado - No mostrar nada, ya está en el menú principal
        await this.bot.sendMessage(chatId, `✅ <b>YA ESTÁ EN EL MENÚ PRINCIPAL</b>

👤 Ya se encuentra autenticado en el sistema.
💡 Use los comandos disponibles directamente:
🌟 <code>/consultar</code> - Consultar asistencia del día
🌟 <code>/reporte</code> - Ver reporte general de asistencia
🌟 <code>/estado</code> - Ver estado de su cuenta
🌟 <code>/contraseña</code> - Cambiar contraseña
🌟 <code>/salir</code> - Cerrar sesión
`, { parse_mode: 'HTML' });
      } else {
        // Usuario no autenticado - Mostrar bienvenida inicial
        await this.enviarBienvenidaInicial(chatId);
      }
    } catch (error) {
      this.logger.error(`❌ Error manejando comando start: ${error.message}`);
      await this.bot.sendMessage(chatId, '❌ Error interno del sistema. Intente nuevamente.');
    }
  }

  /**
   * Maneja el comando /entrar - Iniciar sesión
   */
  private async manejarComandoEntrar(chatId: number, user: any): Promise<void> {
    try {
      const tieneSesion = await this.telegramAuthService.tieneSesionIniciada(user.id);
      
      if (tieneSesion) {
        await this.bot.sendMessage(chatId, `✅ <b>YA TIENE SESIÓN INICIADA</b>

👤 Ya se encuentra autenticado en el sistema.
💡 Use <code>/start</code> para ver el menú principal.`, { parse_mode: 'HTML' });
        return;
      }

      // Iniciar proceso de login
      this.usuariosEnRegistro.set(user.id, {
        estado: 'INICIANDO_SESION'
      });

      const mensaje = `🔐 <b>INICIAR SESIÓN</b>

👨‍👩‍👧‍👦 <b>Estimado(a) padre/madre de familia:</b>

Para acceder a su cuenta, necesitamos verificar sus credenciales.

📝 <b>PASO 1:</b> Envíe su nombre de usuario
👤 Formato: <code>apoderado_12345678</code>

⏳ <b>Estado:</b> Esperando nombre de usuario...
⏰ <b>Tiempo límite:</b> 30 segundos

⚠️ <b>Importante:</b> Si no envía el usuario en 30 segundos, la operación se cancelará automáticamente.`;

      await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });

      // Configurar timeout
      const timeoutId = setTimeout(async () => {
        await this.cancelarOperacionPorTimeout(user.id, chatId, 'INICIANDO_SESION');
      }, 30000);

      const estadoActual = this.usuariosEnRegistro.get(user.id);
      if (estadoActual) {
        estadoActual.timeoutId = timeoutId;
        this.usuariosEnRegistro.set(user.id, estadoActual);
      }

    } catch (error) {
      this.logger.error(`❌ Error manejando comando entrar: ${error.message}`);
      await this.bot.sendMessage(chatId, '❌ Error interno del sistema. Intente nuevamente.');
    }
  }

  /**
   * Maneja el comando /salir - Cerrar sesión
   */
  private async manejarComandoSalir(chatId: number, user: any): Promise<void> {
    try {
      const tieneSesion = await this.telegramAuthService.tieneSesionIniciada(user.id);
      
      if (!tieneSesion) {
        await this.bot.sendMessage(chatId, `❌ <b>NO TIENE SESIÓN INICIADA</b>

👤 No se encuentra autenticado en el sistema.
💡 Use <code>/entrar</code> para iniciar sesión.`, { parse_mode: 'HTML' });
        return;
      }

      // Cerrar sesión
      const resultado = await this.telegramAuthService.cerrarSesion(user.id);
      
      if (resultado.success) {
        const mensaje = `🔓 <b>SESIÓN CERRADA EXITOSAMENTE</b>

👨‍👩‍👧‍👦 <b>Estimado(a) padre/madre de familia:</b>

✅ Su sesión ha sido cerrada correctamente.

🚨 <b>CONFIRMACIÓN:</b>
❌ Ya no recibirá notificaciones de asistencia
❌ No podrá consultar información de sus hijos
❌ Ha perdido acceso a todos los servicios del bot

🔄 <b>Para volver a usar el sistema:</b>
🌟 <code>/entrar</code> - Iniciar sesión nuevamente

🏫 <i>Institucion Educativa Publica "Andrés de los Reyes"</i>`;

        await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
      } else {
        await this.bot.sendMessage(chatId, `❌ <b>ERROR AL CERRAR SESIÓN</b>

⚠️ ${resultado.message}`, { parse_mode: 'HTML' });
      }

    } catch (error) {
      this.logger.error(`❌ Error manejando comando salir: ${error.message}`);
      await this.bot.sendMessage(chatId, '❌ Error interno del sistema. Intente nuevamente.');
    }
  }

  /**
   * Maneja el comando /registro - Solo si no está autenticado
   */
  private async manejarComandoRegistro(chatId: number, user: any): Promise<void> {
    try {
      const tieneSesion = await this.telegramAuthService.tieneSesionIniciada(user.id);
      
      if (tieneSesion) {
        await this.bot.sendMessage(chatId, `✅ <b>YA ESTÁ REGISTRADO</b>

👤 Ya se encuentra registrado y autenticado en el sistema.
💡 Use <code>/start</code> para ver el menú principal.`, { parse_mode: 'HTML' });
        return;
      }

      // Proceder con el registro normal
      await this.iniciarRegistroApoderado(chatId, user);

    } catch (error) {
      this.logger.error(`❌ Error manejando comando registro: ${error.message}`);
      await this.bot.sendMessage(chatId, '❌ Error interno del sistema. Intente nuevamente.');
    }
  }


  /**
   * Maneja el comando /consultar - Solo si está autenticado
   */
  private async manejarComandoConsultar(chatId: number, user: any): Promise<void> {
    try {
      const tieneSesion = await this.telegramAuthService.tieneSesionIniciada(user.id);
      
      if (!tieneSesion) {
        await this.bot.sendMessage(chatId, `❌ <b>DEBE INICIAR SESIÓN PRIMERO</b>

👤 No se encuentra autenticado en el sistema.
💡 Use <code>/entrar</code> para iniciar sesión.`, { parse_mode: 'HTML' });
        return;
      }

      // Obtener información del apoderado autenticado
      const infoApoderado = await this.telegramAuthService.obtenerApoderadoAutenticado(user.id);
      
      if (!infoApoderado.apoderado || !infoApoderado.alumnos) {
        await this.bot.sendMessage(chatId, `❌ <b>ERROR AL OBTENER INFORMACIÓN</b>

⚠️ No se pudo obtener la información de su cuenta.
💡 Intente iniciar sesión nuevamente con <code>/entrar</code>.`, { parse_mode: 'HTML' });
        return;
      }

      // Mostrar opciones de consulta
      const alumnosLista = infoApoderado.alumnos.map((alumno, index) => 
        `${index + 1}. 👶 ${alumno.nombres} ${alumno.apellidos} (DNI: ${alumno.dni})`
      ).join('\n');

      const mensaje = `📊 <b>CONSULTAR ASISTENCIA DEL DÍA</b>

👨‍👩‍👧‍👦 <b>Estimado(a) padre/madre de familia:</b>

👤 <b>Apoderado:</b> ${infoApoderado.apoderado.nombres} ${infoApoderado.apoderado.apellidos}

👶 <b>Seleccione el alumno a consultar:</b>
${alumnosLista}

📝 <b>PASO 1:</b> Envíe el DNI, código o nombre del alumno
🔍 Ejemplo: <code>12345678</code> o <code>Juan Carlos</code>

⏳ <b>Estado:</b> Esperando identificación del alumno...
⏰ <b>Tiempo límite:</b> 30 segundos

⚠️ <b>Importante:</b> Si no envía la información en 30 segundos, la operación se cancelará automáticamente.`;

      // Configurar estado para consulta
      this.usuariosEnRegistro.set(user.id, {
        estado: 'CONSULTANDO_ASISTENCIA',
        apoderado: {
          nombres: infoApoderado.apoderado.nombres,
          apellidos: infoApoderado.apoderado.apellidos,
          alumnos: infoApoderado.alumnos
        }
      });

      await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });

      // Configurar timeout
      const timeoutId = setTimeout(async () => {
        await this.cancelarOperacionPorTimeout(user.id, chatId, 'CONSULTANDO_ASISTENCIA');
      }, 30000);

      const estadoActual = this.usuariosEnRegistro.get(user.id);
      if (estadoActual) {
        estadoActual.timeoutId = timeoutId;
        this.usuariosEnRegistro.set(user.id, estadoActual);
      }

    } catch (error) {
      this.logger.error(`❌ Error manejando comando consultar: ${error.message}`);
      await this.bot.sendMessage(chatId, '❌ Error interno del sistema. Intente nuevamente.');
    }
  }

  /**
   * Maneja el comando /estado - Solo si está autenticado
   */
  private async manejarComandoEstado(chatId: number, user: any): Promise<void> {
    try {
      const tieneSesion = await this.telegramAuthService.tieneSesionIniciada(user.id);
      
      if (!tieneSesion) {
        await this.bot.sendMessage(chatId, `❌ <b>DEBE INICIAR SESIÓN PRIMERO</b>

👤 No se encuentra autenticado en el sistema.
💡 Use <code>/entrar</code> para iniciar sesión.`, { parse_mode: 'HTML' });
        return;
      }

      // Obtener información del apoderado autenticado
      const infoApoderado = await this.telegramAuthService.obtenerApoderadoAutenticado(user.id);
      
      if (!infoApoderado.apoderado || !infoApoderado.alumnos) {
        await this.bot.sendMessage(chatId, `❌ <b>ERROR AL OBTENER INFORMACIÓN</b>

⚠️ No se pudo obtener la información de su cuenta.
💡 Intente iniciar sesión nuevamente con <code>/entrar</code>.`, { parse_mode: 'HTML' });
        return;
      }

      // Usar el método unificado para mostrar el menú de estado
      await this.enviarMenuEstado(chatId, user.id);

    } catch (error) {
      this.logger.error(`❌ Error manejando comando estado: ${error.message}`);
      await this.bot.sendMessage(chatId, '❌ Error interno del sistema. Intente nuevamente.');
    }
  }

  /**
   * Maneja el comando /contraseña - Solo si está autenticado
   */
  private async manejarComandoContraseña(chatId: number, user: any): Promise<void> {
    try {
      const tieneSesion = await this.telegramAuthService.tieneSesionIniciada(user.id);
      
      if (!tieneSesion) {
        await this.bot.sendMessage(chatId, `❌ <b>DEBE INICIAR SESIÓN PRIMERO</b>

👤 No se encuentra autenticado en el sistema.
💡 Use <code>/entrar</code> para iniciar sesión.`, { parse_mode: 'HTML' });
        return;
      }

      // Iniciar proceso de cambio de contraseña
      this.usuariosEnRegistro.set(user.id, {
        estado: 'CAMBIANDO_CONTRASEÑA'
      });

      const mensaje = `🔑 <b>CAMBIAR CONTRASEÑA</b>

👨‍👩‍👧‍👦 <b>Estimado(a) padre/madre de familia:</b>

Para cambiar su contraseña, necesitamos verificar su identidad.

📝 <b>PASO 1:</b> Envíe su nueva contraseña
🔐 Debe tener al menos 8 caracteres
🔐 Incluya letras, números y símbolos

⏳ <b>Estado:</b> Esperando nueva contraseña...
⏰ <b>Tiempo límite:</b> 30 segundos

⚠️ <b>Importante:</b> Si no envía la contraseña en 30 segundos, la operación se cancelará automáticamente.`;

      await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });

      // Configurar timeout
      const timeoutId = setTimeout(async () => {
        await this.cancelarOperacionPorTimeout(user.id, chatId, 'CAMBIANDO_CONTRASEÑA');
      }, 30000);

      const estadoActual = this.usuariosEnRegistro.get(user.id);
      if (estadoActual) {
        estadoActual.timeoutId = timeoutId;
        this.usuariosEnRegistro.set(user.id, estadoActual);
      }

    } catch (error) {
      this.logger.error(`❌ Error manejando comando contraseña: ${error.message}`);
      await this.bot.sendMessage(chatId, '❌ Error interno del sistema. Intente nuevamente.');
    }
  }

  /**
   * Maneja el comando /reporte - Solo si está autenticado
   */
  private async manejarComandoReporte(chatId: number, user: any): Promise<void> {
    try {
      const tieneSesion = await this.telegramAuthService.tieneSesionIniciada(user.id);
      
      if (!tieneSesion) {
        await this.bot.sendMessage(chatId, `❌ <b>DEBE INICIAR SESIÓN PRIMERO</b>

👤 No se encuentra autenticado en el sistema.
💡 Use <code>/entrar</code> para iniciar sesión.`, { parse_mode: 'HTML' });
        return;
      }

      // Obtener información del apoderado autenticado
      const infoApoderado = await this.telegramAuthService.obtenerApoderadoAutenticado(user.id);
      
      if (!infoApoderado.apoderado || !infoApoderado.alumnos) {
        await this.bot.sendMessage(chatId, `❌ <b>ERROR AL OBTENER INFORMACIÓN</b>

⚠️ No se pudo obtener la información de su cuenta.
💡 Intente iniciar sesión nuevamente con <code>/entrar</code>.`, { parse_mode: 'HTML' });
        return;
      }

      // Mostrar opciones de reporte
      const alumnosLista = infoApoderado.alumnos.map((alumno, index) => 
        `${index + 1}. 👶 ${alumno.nombres} ${alumno.apellidos} (DNI: ${alumno.dni})`
      ).join('\n');

      const mensaje = `📊 <b>REPORTE GENERAL DE ASISTENCIA</b>

👨‍👩‍👧‍👦 <b>Estimado(a) padre/madre de familia:</b>

👤 <b>Apoderado:</b> ${infoApoderado.apoderado.nombres} ${infoApoderado.apoderado.apellidos}

👶 <b>Seleccione el alumno para el reporte:</b>
${alumnosLista}

📝 <b>PASO 1:</b> Envíe el DNI, código o nombre del alumno
🔍 Ejemplo: <code>12345678</code> o <code>Juan Carlos</code>

⏳ <b>Estado:</b> Esperando identificación del alumno...
⏰ <b>Tiempo límite:</b> 30 segundos

⚠️ <b>Importante:</b> Si no envía la información en 30 segundos, la operación se cancelará automáticamente.`;

      // Configurar estado para reporte
      this.usuariosEnRegistro.set(user.id, {
        estado: 'GENERANDO_REPORTE',
        apoderado: {
          nombres: infoApoderado.apoderado.nombres,
          apellidos: infoApoderado.apoderado.apellidos,
          alumnos: infoApoderado.alumnos
        }
      });

      await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });

      // Configurar timeout
      const timeoutId = setTimeout(async () => {
        await this.cancelarOperacionPorTimeout(user.id, chatId, 'CONSULTANDO_ASISTENCIA');
      }, 30000);

      const estadoActual = this.usuariosEnRegistro.get(user.id);
      if (estadoActual) {
        estadoActual.timeoutId = timeoutId;
        this.usuariosEnRegistro.set(user.id, estadoActual);
      }

    } catch (error) {
      this.logger.error(`❌ Error manejando comando reporte: ${error.message}`);
      await this.bot.sendMessage(chatId, '❌ Error interno del sistema. Intente nuevamente.');
    }
  }

  /**
   * Envía mensaje de bienvenida inicial (usuario no autenticado)
   */
  private async enviarBienvenidaInicial(chatId: number): Promise<void> {
    const mensaje = `🎉 <b>BIENVENIDO AL SISTEMA DE NOTIFICACIONES</b>

👨‍👩‍👧‍👦 <b>Estimado(a) padre/madre de familia:</b>

Bienvenido al sistema de notificaciones de la Institución Educativa Pública "Andrés de los Reyes".

📱 <b>Este bot le permitirá:</b>
🔔 Recibir notificaciones de asistencia de sus hijos
📊 Consultar el estado de asistencia en tiempo real
📈 Ver reportes detallados de asistencia
🔐 Acceder de forma segura con sus credenciales

💡 <b>Comandos disponibles:</b>
🌟 <code>/start</code> - Ver este menú
🌟 <code>/entrar</code> - Iniciar sesión con sus credenciales

🏫 <i>Institucion Educativa Publica "Andrés de los Reyes"</i>`;

    await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
  }

  /**
   * Envía menú de estado (usuario autenticado) - Menú principal
   */
  private async enviarMenuEstado(chatId: number, userId: number): Promise<void> {
    try {
      // Obtener información del apoderado autenticado
      const infoApoderado = await this.telegramAuthService.obtenerApoderadoAutenticado(userId);
      
      if (!infoApoderado.apoderado || !infoApoderado.alumnos) {
        await this.bot.sendMessage(chatId, `❌ <b>ERROR AL OBTENER INFORMACIÓN</b>

⚠️ No se pudo obtener la información de su cuenta.
💡 Intente iniciar sesión nuevamente con <code>/entrar</code>.`, { parse_mode: 'HTML' });
        return;
      }

      const alumnosLista = infoApoderado.alumnos.map((alumno, index) => 
        `${index + 1}. 👶 ${alumno.nombres} ${alumno.apellidos} (${alumno.nivel} - ${alumno.grado}° ${alumno.seccion})`
      ).join('\n');

      const mensaje = `📊 <b>ESTADO DE SU CUENTA</b>

👨‍👩‍👧‍👦 <b>Estimado(a) padre/madre de familia:</b>

✅ <b>Sesión iniciada correctamente</b>

👤 <b>Apoderado:</b> ${infoApoderado.apoderado.nombres} ${infoApoderado.apoderado.apellidos}
🔢 <b>DNI:</b> ${infoApoderado.apoderado.dni}

📊 <b>Estado de notificaciones:</b> ✅ <b>ACTIVO</b>
🔔 <b>Recibe notificaciones:</b> ✅ <b>SÍ</b>

👶 <b>Sus hijos(as) asignados:</b>
${alumnosLista}

💡 <b>Comandos disponibles:</b>
🌟 <code>/consultar</code> - Consultar asistencia del día
🌟 <code>/reporte</code> - Ver reporte general de asistencia
🌟 <code>/estado</code> - Ver estado de su cuenta
🌟 <code>/contraseña</code> - Cambiar contraseña
🌟 <code>/salir</code> - Cerrar sesión

🏫 <i>Institucion Educativa Publica "Andrés de los Reyes"</i>`;

      await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });

    } catch (error) {
      this.logger.error(`❌ Error enviando menú principal: ${error.message}`);
      await this.bot.sendMessage(chatId, '❌ Error interno del sistema. Intente nuevamente.');
    }
  }

  /**
   * Cancela operación por timeout
   */
  private async cancelarOperacionPorTimeout(userId: number, chatId: number, estado: string): Promise<void> {
    try {
      this.usuariosEnRegistro.delete(userId);
      
      let mensaje = '';
      switch (estado) {
        case 'INICIANDO_SESION':
          mensaje = `⏰ <b>OPERACIÓN CANCELADA POR TIMEOUT</b>

⚠️ No se recibió respuesta en el tiempo límite.

💡 <b>Comandos disponibles:</b>
🌟 <code>/start</code> - Ver menú principal
🌟 <code>/entrar</code> - Intentar iniciar sesión nuevamente`;
          break;
        case 'CAMBIANDO_CONTRASEÑA':
          mensaje = `⏰ <b>OPERACIÓN CANCELADA POR TIMEOUT</b>

⚠️ No se recibió la nueva contraseña en el tiempo límite.

💡 <b>Comandos disponibles:</b>
🌟 <code>/start</code> - Ver menú principal
🌟 <code>/contraseña</code> - Intentar cambiar contraseña nuevamente`;
          break;
        case 'CONSULTANDO_ASISTENCIA':
          mensaje = `⏰ <b>OPERACIÓN CANCELADA POR TIMEOUT</b>

⚠️ No se recibió la información del alumno en el tiempo límite.

💡 <b>Comandos disponibles:</b>
🌟 <code>/start</code> - Ver menú principal
🌟 <code>/consultar</code> - Intentar consultar asistencia nuevamente`;
          break;
        case 'GENERANDO_REPORTE':
          mensaje = `⏰ <b>OPERACIÓN CANCELADA POR TIMEOUT</b>

⚠️ No se recibió la información del alumno en el tiempo límite.

💡 <b>Comandos disponibles:</b>
🌟 <code>/start</code> - Ver menú principal
🌟 <code>/reporte</code> - Intentar generar reporte nuevamente`;
          break;
        default:
          mensaje = `⏰ <b>OPERACIÓN CANCELADA POR TIMEOUT</b>

⚠️ No se recibió respuesta en el tiempo límite.

💡 Use <code>/start</code> para ver el menú principal.`;
      }

      await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });

    } catch (error) {
      this.logger.error(`❌ Error cancelando operación por timeout: ${error.message}`);
    }
  }

  /**
   * Procesa el inicio de sesión del usuario
   */
  private async procesarInicioSesion(userId: number, chatId: number, texto: string): Promise<void> {
    try {
      const estadoUsuario = this.usuariosEnRegistro.get(userId);
      if (!estadoUsuario) {
        await this.bot.sendMessage(chatId, '❌ Error: Estado de sesión no válido. Use /entrar para comenzar.');
        return;
      }

      // Limpiar timeout si existe
      if (estadoUsuario.timeoutId) {
        clearTimeout(estadoUsuario.timeoutId);
        delete estadoUsuario.timeoutId;
      }

      // Si no hay username almacenado, este es el username
      if (!estadoUsuario.dniApoderado) {
        // Validar formato del username (nombre_dni)
        if (!texto.includes('_') || texto.length < 8) {
          const mensaje = `❌ <b>USUARIO INVÁLIDO</b>

⚠️ El nombre de usuario debe tener el formato: <code>nombre_dni</code>
📝 Ejemplo: <code>abel_77164942</code>

🔄 <b>Intenta nuevamente:</b>`;
          await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
          return;
        }

        // Almacenar username y pedir contraseña
        estadoUsuario.dniApoderado = texto;
        this.usuariosEnRegistro.set(userId, estadoUsuario);

        const mensaje = `🔐 <b>INICIAR SESIÓN</b>

👨‍👩‍👧‍👦 <b>Estimado(a) padre/madre de familia:</b>

✅ Usuario recibido: <code>${texto}</code>

📝 <b>PASO 2:</b> Envíe su contraseña
🔑 Ingrese la contraseña de su cuenta

⏳ <b>Estado:</b> Esperando contraseña...
⏰ <b>Tiempo límite:</b> 30 segundos

⚠️ <b>Importante:</b> Si no envía la contraseña en 30 segundos, la operación se cancelará automáticamente.`;

        await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });

        // Configurar timeout
        const timeoutId = setTimeout(async () => {
          await this.cancelarOperacionPorTimeout(userId, chatId, 'INICIANDO_SESION');
        }, 30000);

        estadoUsuario.timeoutId = timeoutId;
        this.usuariosEnRegistro.set(userId, estadoUsuario);

      } else {
        // Este es el password, intentar iniciar sesión
        const resultado = await this.telegramAuthService.iniciarSesion(userId, chatId, estadoUsuario.dniApoderado, texto);

        if (resultado.success) {
          // Sesión iniciada exitosamente
          const alumnosLista = resultado.alumnos?.map((alumno, index) => 
            `${index + 1}. 👶 ${alumno.nombres} ${alumno.apellidos} (${alumno.nivel} - ${alumno.grado}° ${alumno.seccion})`
          ).join('\n') || 'No hay alumnos asignados';

          const mensaje = `🎉 <b>¡SESIÓN INICIADA EXITOSAMENTE!</b>

👨‍👩‍👧‍👦 <b>Estimado(a) padre/madre de familia:</b>

✅ Bienvenido de vuelta al sistema de notificaciones.

👤 <b>Apoderado:</b> ${resultado.apoderado?.nombres} ${resultado.apoderado?.apellidos}
🔢 <b>DNI:</b> ${resultado.apoderado?.dni}

👶 <b>Sus hijos(as) asignados:</b>
${alumnosLista}

💡 <b>Comandos disponibles:</b>
🌟 <code>/start</code> - Ver menú principal
🌟 <code>/consultar</code> - Consultar asistencia del día
🌟 <code>/reporte</code> - Ver reporte general de asistencia
🌟 <code>/estado</code> - Ver estado de su cuenta
🌟 <code>/contraseña</code> - Cambiar contraseña
🌟 <code>/salir</code> - Cerrar sesión

🏫 <i>Institucion Educativa Publica "Andrés de los Reyes"</i>`;

          await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
        } else {
          // Error en el inicio de sesión
          const mensaje = `❌ <b>ERROR AL INICIAR SESIÓN</b>

⚠️ ${resultado.message}

💡 <b>Comandos disponibles:</b>
🌟 <code>/start</code> - Ver menú principal
🌟 <code>/entrar</code> - Intentar iniciar sesión nuevamente`;

          await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
        }

        // Limpiar estado del usuario
        this.usuariosEnRegistro.delete(userId);
      }

    } catch (error) {
      this.logger.error(`❌ Error procesando inicio de sesión: ${error.message}`);
      await this.bot.sendMessage(chatId, '❌ Error interno del sistema. Intente nuevamente.');
    }
  }

  /**
   * Procesa el cambio de contraseña del usuario
   */
  private async procesarCambioContraseña(userId: number, chatId: number, texto: string): Promise<void> {
    try {
      const estadoUsuario = this.usuariosEnRegistro.get(userId);
      if (!estadoUsuario) {
        await this.bot.sendMessage(chatId, '❌ Error: Estado no válido. Use /contraseña para comenzar.');
        return;
      }

      // Limpiar timeout si existe
      if (estadoUsuario.timeoutId) {
        clearTimeout(estadoUsuario.timeoutId);
        delete estadoUsuario.timeoutId;
      }

      // Validar contraseña
      if (texto.length < 8) {
        const mensaje = `❌ <b>CONTRASEÑA INVÁLIDA</b>

⚠️ La contraseña debe tener al menos 8 caracteres.
🔐 Incluya letras, números y símbolos para mayor seguridad.

🔄 <b>Intenta nuevamente:</b>`;
        await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
        return;
      }

      // Cambiar contraseña
      const resultado = await this.telegramAuthService.cambiarContraseña(userId, texto);

      if (resultado.success) {
        const mensaje = `✅ <b>CONTRASEÑA ACTUALIZADA EXITOSAMENTE</b>

👨‍👩‍👧‍👦 <b>Estimado(a) padre/madre de familia:</b>

🔑 Su contraseña ha sido actualizada correctamente.

⚠️ <b>IMPORTANTE:</b> 
📝 Guarde su nueva contraseña en un lugar seguro
🔐 La necesitará para futuros inicios de sesión

💡 <b>Comandos disponibles:</b>
🌟 <code>/start</code> - Ver menú principal
🌟 <code>/estado</code> - Ver estado de su cuenta

🏫 <i>Institucion Educativa Publica "Andrés de los Reyes"</i>`;

        await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
      } else {
        const mensaje = `❌ <b>ERROR AL CAMBIAR CONTRASEÑA</b>

⚠️ ${resultado.message}

💡 <b>Comandos disponibles:</b>
🌟 <code>/start</code> - Ver menú principal
🌟 <code>/contraseña</code> - Intentar cambiar contraseña nuevamente`;

        await this.bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
      }

      // Limpiar estado del usuario
      this.usuariosEnRegistro.delete(userId);

    } catch (error) {
      this.logger.error(`❌ Error procesando cambio de contraseña: ${error.message}`);
      await this.bot.sendMessage(chatId, '❌ Error interno del sistema. Intente nuevamente.');
    }
  }
}
