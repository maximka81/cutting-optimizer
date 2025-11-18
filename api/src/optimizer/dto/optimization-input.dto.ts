import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsArray, ValidateNested } from 'class-validator';
import { PartDto } from './part.dto';
import { MaterialDto } from './material.dto';
import { OptimizationOptionsDto } from './optimization-options.dto';

export class OptimizationInputDto {
  @ApiProperty({ type: [PartDto], description: 'Список деталей для оптимизации', required: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartDto)
  parts!: PartDto[];

  @ApiProperty({
    type: [MaterialDto],
    description: 'Доступные материалы (опционально)',
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialDto)
  @IsOptional()
  availableMaterials?: MaterialDto[];

  @ApiProperty({ type: OptimizationOptionsDto, description: 'Опции оптимизации', required: true })
  @ValidateNested()
  @Type(() => OptimizationOptionsDto)
  options!: OptimizationOptionsDto;
}
