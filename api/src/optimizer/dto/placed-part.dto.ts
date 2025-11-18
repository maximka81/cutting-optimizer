import { ApiProperty } from '@nestjs/swagger';

export class PlacedPartDto {
  @ApiProperty({ description: 'ID размещённой детали (может включать суффикс копии)' })
  id!: string;

  @ApiProperty({ description: 'Длина в размещённом положении', example: 1200 })
  length!: number;

  @ApiProperty({ description: 'Ширина в размещённом положении', example: 600 })
  width!: number;

  @ApiProperty({ description: 'Координата X на листе', example: 0 })
  x!: number;

  @ApiProperty({ description: 'Координата Y на листе', example: 0 })
  y!: number;

  @ApiProperty({ description: 'Площадь детали', example: 720000 })
  square!: number;

  @ApiProperty({ description: 'Была ли деталь повёрнута', example: true })
  rotated!: boolean;

  @ApiProperty({ description: 'Цвет материала' })
  color!: string;

  @ApiProperty({ description: 'Толщина материала' })
  thickness!: number;

  @ApiProperty({ description: 'Метка детали' })
  label!: string;

  @ApiProperty({ description: 'Описание детали' })
  description!: string;

  @ApiProperty({ description: 'Оригинальный ID детали до размножения' })
  originalId!: string;

  @ApiProperty({ description: 'ID группы, если деталь была разрезана', required: false })
  splitGroupId?: string;
}
