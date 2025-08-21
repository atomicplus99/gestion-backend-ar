import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Turno } from './turno.entity';

@Injectable()
export class TurnoService {
  private readonly logger = new Logger(TurnoService.name);

  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepo: Repository<Turno>,
  ) {
    console.log('🔧 [TurnoService] Servicio de turnos inicializado');
    console.log('🔧 [TurnoService] Repository inyectado:', this.turnoRepo ? 'SÍ' : 'NO');
  }

  async findAll(): Promise<Turno[]> {
    console.log('🔍 [TurnoService] Iniciando búsqueda de turnos...');
    try {
      this.logger.log('Obteniendo todos los turnos');
      console.log('📊 [TurnoService] Ejecutando query: this.turnoRepo.find()');
      
      const turnos = await this.turnoRepo.find();
      
      console.log(`✅ [TurnoService] Query ejecutada exitosamente`);
      console.log(`📊 [TurnoService] Resultado: ${turnos.length} turnos encontrados`);
      
      if (turnos.length > 0) {
        console.log('📋 [TurnoService] Primer turno:', JSON.stringify(turnos[0], null, 2));
      } else {
        console.log('⚠️ [TurnoService] No se encontraron turnos en la base de datos');
      }
      
      this.logger.log(`Se encontraron ${turnos.length} turnos`);
      return turnos;
    } catch (error) {
      console.error('❌ [TurnoService] Error en la base de datos:', error);
      console.error('❌ [TurnoService] Stack trace:', error.stack);
      this.logger.error('Error al obtener turnos:', error);
      throw error;
    }
  }
}
