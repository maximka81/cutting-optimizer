import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class OptimizationOptionsDto {
  @ApiProperty({ description: 'Минимизировать отходы', required: true })
  @IsBoolean()
  minWaste!: boolean;

  @ApiProperty({ description: 'Максимизировать использование материала', required: true })
  @IsBoolean()
  maxUtilization!: boolean;

  @ApiProperty({ description: 'Использовать умную упаковку', required: true })
  @IsBoolean()
  smartPack!: boolean;

  @ApiProperty({ description: 'Использовать бесконечные материалы', required: true })
  @IsBoolean()
  useInfiniteMaterials!: boolean;

  @ApiProperty({ description: 'Дополнительный тег (опционально)', required: false })
  @IsBoolean()
  @IsOptional()
  tag?: boolean;
}
