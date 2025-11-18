import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, IsInt } from 'class-validator';

export class MaterialDto {
  @ApiProperty({ description: 'Уникальный идентификатор материала', required: true })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Длина материала', required: true })
  @IsNumber()
  @IsPositive()
  length!: number;

  @ApiProperty({ description: 'Ширина материала', required: true })
  @IsNumber()
  @IsPositive()
  width!: number;

  @ApiProperty({ description: 'Цвет материала', required: true })
  @IsString()
  color!: string;

  @ApiProperty({ description: 'Толщина материала', required: true })
  @IsNumber()
  @IsPositive()
  thickness!: number;

  @ApiProperty({ description: 'Доступное количество материала', required: true })
  @IsInt()
  @IsPositive()
  availableQuantity!: number;
}
