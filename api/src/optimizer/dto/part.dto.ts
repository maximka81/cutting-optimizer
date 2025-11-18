import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, IsInt, IsBoolean } from 'class-validator';

export class PartDto {
  @ApiProperty({ description: 'Уникальный идентификатор детали', required: true })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Длина детали', required: true })
  @IsNumber()
  @IsPositive()
  length!: number;

  @ApiProperty({ description: 'Ширина детали', required: true })
  @IsNumber()
  @IsPositive()
  width!: number;

  @ApiProperty({ description: 'Цвет детали', required: true })
  @IsString()
  color!: string;

  @ApiProperty({ description: 'Толщина детали', required: true })
  @IsNumber()
  @IsPositive()
  thickness!: number;

  @ApiProperty({ description: 'Количество деталей', required: true })
  @IsInt()
  @IsPositive()
  quantity!: number;

  @ApiProperty({ description: 'Можно ли вращать деталь', required: true })
  @IsBoolean()
  canRotate!: boolean;

  @ApiProperty({ description: 'Метка детали', required: true })
  @IsString()
  label!: string;

  @ApiProperty({ description: 'Описание детали', required: true })
  @IsString()
  description!: string;
}
