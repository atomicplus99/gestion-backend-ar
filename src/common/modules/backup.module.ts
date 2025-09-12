import { Module } from '@nestjs/common';
import { BackupService } from '../services/backup.service';
import { BackupController } from '../controllers/backup.controller';

@Module({
  providers: [BackupService],
  controllers: [BackupController],
  exports: [BackupService],
})
export class BackupModule {}
