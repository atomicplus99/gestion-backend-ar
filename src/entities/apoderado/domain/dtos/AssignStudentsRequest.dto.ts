import { IsArray, IsUUID } from 'class-validator';

export class AssignStudentsRequestDto {
  @IsArray()
  @IsUUID('4', { each: true })
  estudiante_ids: string[];
}
