import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService{



  getHello(): string {
    return 'Hello World!';
  }
}
