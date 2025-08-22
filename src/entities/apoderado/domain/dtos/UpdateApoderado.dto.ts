import { PartialType } from '@nestjs/mapped-types';
import { CreateApoderadoDto } from './CreateApoderado.dto';

export class UpdateApoderadoDto extends PartialType(CreateApoderadoDto) {}
