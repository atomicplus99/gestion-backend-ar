import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
    registerDecorator,
    ValidationOptions
  } from 'class-validator';
  import { Injectable } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';

  
  @ValidatorConstraint({ async: true })
  @Injectable()
  export class UniqueCodigoConstraint implements ValidatorConstraintInterface {
    constructor(
      @InjectRepository(Alumno)
      private readonly repo: Repository<Alumno>
    ) {}
  
    async validate(codigo: string, args: ValidationArguments) {
      const exists = await this.repo.findOne({ where: { codigo } });
      return !exists;
    }
  
    defaultMessage(args: ValidationArguments) {
      return `El código '${args.value}' ya está en uso.`;
    }
  }
  
  export function UniqueCodigo(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
      registerDecorator({
        name: 'UniqueCodigoAlumno',
        target: object.constructor,
        propertyName,
        options: validationOptions,
        validator: UniqueCodigoConstraint,
      });
    };
  }
  