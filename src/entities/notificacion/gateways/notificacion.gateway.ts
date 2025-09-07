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
    this.server = server;
  }

  /**
   * Manejar conexión de cliente
   */
  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client);

    // Enviar mensaje de bienvenida
    client.emit('connected', {
      message: 'Conectado al sistema de notificaciones',
      clientId: client.id,
      timestamp: new Date().toISOString()
    });

    // Agregar listener para errores
    client.on('error', (error) => {
    });

    // Agregar listener para desconexión
    client.on('disconnect', (reason) => {
      this.connectedClients.delete(client.id);
    });

    // Agregar listener para todos los mensajes
    client.onAny((eventName, ...args) => {
    });

    // Agregar listener específico para el evento 'connect' de Socket.IO
    client.on('connect', () => {
    });
  }

  /**
   * Manejar desconexión de cliente
   */
  handleDisconnect(client: Socket) {
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
      
      // Unir al cliente a una sala específica del usuario
      client.join(`user_${usuario_id}`);
      
      client.emit('subscribed', {
        message: `Suscrito a notificaciones de usuario ${usuario_id}`,
        usuario_id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
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
      
      // Unir al cliente a la sala global
      client.join('global');
      
      
      client.emit('subscribed_global', {
        message: 'Suscrito a notificaciones globales',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
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
      
      // Si la notificación tiene un usuario_id específico, enviar solo a ese usuario
      if (notificacion.usuario_id) {
        await this.sendNotificationToUser(notificacion, notificacion.usuario_id);
        return;
      }
      
      // Si no tiene usuario_id, es una notificación global (scheduler, etc.)
      // Enviar a TODOS los clientes conectados
      this.server.emit('new_notification', {
        notificacion,
        timestamp: new Date().toISOString()
      });


    } catch (error) {
    }
  }

  /**
   * Enviar notificación a un usuario específico
   */
  async sendNotificationToUser(notificacion: Notificacion, usuario_id: string) {
    try {
      
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
