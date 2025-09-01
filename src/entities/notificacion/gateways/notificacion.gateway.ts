import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { NotificacionService } from '../services/notificacion.service';
import { Notificacion } from '../notificacion.entity';

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'development' 
      ? ['http://localhost:4200', 'http://localhost:3000', 'ws://localhost:3000'] 
      : process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: process.env.NODE_ENV === 'development' ? false : true,
  }
})
export class NotificacionGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificacionGateway.name);
  private connectedClients = new Map<string, Socket>();

  constructor(
    private readonly notificacionService: NotificacionService,
  ) {}

  /**
   * Inicializar el gateway
   */
  afterInit(server: Server) {
    this.logger.log('🚀 WebSocket Gateway inicializado correctamente');
    this.server = server;
  }

  /**
   * Manejar conexión de cliente
   */
  handleConnection(client: Socket) {
    this.logger.log(`🔌 Cliente conectado: ${client.id}`);
    this.connectedClients.set(client.id, client);

    // Enviar mensaje de bienvenida
    client.emit('connected', {
      message: 'Conectado al sistema de notificaciones',
      clientId: client.id,
      timestamp: new Date().toISOString()
    });

    // Agregar listener para errores
    client.on('error', (error) => {
      this.logger.error(`❌ Error en cliente ${client.id}:`, error);
    });

    // Agregar listener para desconexión
    client.on('disconnect', (reason) => {
      this.logger.log(`🔌 Cliente ${client.id} desconectado. Razón: ${reason}`);
      this.connectedClients.delete(client.id);
    });

    // Agregar listener para todos los mensajes
    client.onAny((eventName, ...args) => {
      this.logger.log(`📨 Cliente ${client.id} envió evento: ${eventName}`, args);
    });

    // Agregar listener específico para el evento 'connect' de Socket.IO
    client.on('connect', () => {
      this.logger.log(`🔌 Cliente ${client.id} emitió evento 'connect'`);
    });
  }

  /**
   * Manejar desconexión de cliente
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Cliente desconectado: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  /**
   * Suscribirse a notificaciones de un usuario específico
   */
  @SubscribeMessage('subscribe_user')
  handleSubscribeUser(
    @MessageBody() data: { usuario_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { usuario_id } = data;
      this.logger.log(`👤 Cliente ${client.id} se suscribió a notificaciones de usuario: ${usuario_id}`);
      
      // Unir al cliente a una sala específica del usuario
      client.join(`user_${usuario_id}`);
      
      client.emit('subscribed', {
        message: `Suscrito a notificaciones de usuario ${usuario_id}`,
        usuario_id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error(`❌ Error suscribiendo usuario: ${error.message}`);
      client.emit('error', {
        message: 'Error al suscribirse a notificaciones',
        error: error.message
      });
    }
  }

  /**
   * Suscribirse a notificaciones globales (scheduler, etc.)
   */
  @SubscribeMessage('subscribe_global')
  handleSubscribeGlobal(@ConnectedSocket() client: Socket) {
    try {
      this.logger.log(`🌐 Cliente ${client.id} se suscribió a notificaciones globales`);
      
      // Unir al cliente a la sala global
      client.join('global');
      
      this.logger.log(`🌐 Cliente ${client.id} unido a sala 'global'`);
      
      client.emit('subscribed_global', {
        message: 'Suscrito a notificaciones globales',
        timestamp: new Date().toISOString()
      });
      
      this.logger.log(`🌐 Respuesta enviada a cliente ${client.id}`);
    } catch (error) {
      this.logger.error(`❌ Error suscribiendo global: ${error.message}`);
      this.logger.error(`❌ Stack trace:`, error.stack);
      client.emit('error', {
        message: 'Error al suscribirse a notificaciones globales',
        error: error.message
      });
    }
  }

  /**
   * Obtener contador de notificaciones no leídas
   */
  @SubscribeMessage('get_unread_count')
  async handleGetUnreadCount(
    @MessageBody() data: { usuario_id?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { usuario_id } = data;
      const count = await this.notificacionService.getUnreadCount(usuario_id);
      
      client.emit('unread_count', {
        count,
        usuario_id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error(`❌ Error obteniendo contador: ${error.message}`);
      client.emit('error', {
        message: 'Error al obtener contador de notificaciones',
        error: error.message
      });
    }
  }

  /**
   * Marcar notificación como leída
   */
  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() data: { notificacion_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { notificacion_id } = data;
      await this.notificacionService.markAsRead(notificacion_id);
      
      client.emit('marked_as_read', {
        notificacion_id,
        message: 'Notificación marcada como leída',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error(`❌ Error marcando como leída: ${error.message}`);
      client.emit('error', {
        message: 'Error al marcar notificación como leída',
        error: error.message
      });
    }
  }

  /**
   * Enviar notificación a todos los clientes conectados
   */
  async broadcastNotification(notificacion: Notificacion) {
    try {
      this.logger.log(`📢 Enviando notificación a todos los clientes: ${notificacion.titulo}`);
      this.logger.log(`📊 Clientes conectados: ${this.connectedClients.size}`);
      
      // Si la notificación tiene un usuario_id específico, enviar solo a ese usuario
      if (notificacion.usuario_id) {
        this.logger.log(`📢 Enviando notificación a usuario específico: ${notificacion.usuario_id}`);
        await this.sendNotificationToUser(notificacion, notificacion.usuario_id);
        return;
      }
      
      // Si no tiene usuario_id, es una notificación global (scheduler, etc.)
      // Enviar a TODOS los clientes conectados
      this.server.emit('new_notification', {
        notificacion,
        timestamp: new Date().toISOString()
      });

      this.logger.log(`✅ Notificación enviada a ${this.connectedClients.size} clientes`);

    } catch (error) {
      this.logger.error(`❌ Error enviando notificación: ${error.message}`);
    }
  }

  /**
   * Enviar notificación a un usuario específico
   */
  async sendNotificationToUser(notificacion: Notificacion, usuario_id: string) {
    try {
      this.logger.log(`📢 Enviando notificación a usuario ${usuario_id}: ${notificacion.titulo}`);
      
      this.server.to(`user_${usuario_id}`).emit('new_notification', {
        notificacion,
        timestamp: new Date().toISOString()
      });

      // Actualizar contador para este usuario
      const count = await this.notificacionService.getUnreadCount(usuario_id);
      this.server.to(`user_${usuario_id}`).emit('unread_count', {
        count,
        usuario_id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error(`❌ Error enviando notificación a usuario: ${error.message}`);
    }
  }

  /**
   * Actualizar contadores de notificaciones no leídas
   */
  async updateUnreadCounts() {
    try {
      // Obtener todos los clientes conectados
      const clients = Array.from(this.connectedClients.values());
      
      for (const client of clients) {
        // Obtener salas del cliente
        const rooms = Array.from(client.rooms);
        
        for (const room of rooms) {
          if (room.startsWith('user_')) {
            const usuario_id = room.replace('user_', '');
            const count = await this.notificacionService.getUnreadCount(usuario_id);
            
            client.emit('unread_count', {
              count,
              usuario_id,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      this.logger.error(`❌ Error actualizando contadores: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de conexiones
   */
  getConnectionStats() {
    return {
      totalClients: this.connectedClients.size,
      connectedClients: Array.from(this.connectedClients.keys()),
      timestamp: new Date().toISOString()
    };
  }
}
