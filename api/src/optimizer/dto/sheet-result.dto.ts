import { ApiProperty } from '@nestjs/swagger';
import { PlacedPartDto } from './placed-part.dto';

export class SheetResultDto {
  @ApiProperty({ description: 'Длина листа', example: 3000 })
  length!: number;

  @ApiProperty({ description: 'Ширина листа', example: 1250 })
  width!: number;

  @ApiProperty({ description: 'Цвет материала' })
  color!: string;

  @ApiProperty({ description: 'Толщина материала' })
  thickness!: number;

  @ApiProperty({ type: [PlacedPartDto], description: 'Размещённые детали на этом листе' })
  parts!: PlacedPartDto[];

  @ApiProperty({ description: 'Отходы на этом листе' })
  waste!: {
    square: number;
    utilizationRate: number;
  };
}
