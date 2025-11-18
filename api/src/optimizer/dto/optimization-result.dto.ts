import { ApiProperty } from '@nestjs/swagger';
import { SheetResultDto } from './sheet-result.dto';
import { UnplacedPartInfoDto } from './unplaced-part-info.dto';

export class OptimizationResultDto {
  @ApiProperty({ type: [SheetResultDto], description: 'Список использованных листов' })
  sheets!: SheetResultDto[];

  @ApiProperty({ description: 'Общие отходы (мм²)' })
  totalWaste!: number;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        color: { type: 'string' },
        thickness: { type: 'number' },
        square: { type: 'number' },
      },
    },
    description: 'Отходы по цвету и толщине',
  })
  waste!: { color: string; thickness: number; square: number }[];

  @ApiProperty({ description: 'Процент использования материала (0-100)' })
  utilizationRate!: number;

  @ApiProperty({ description: 'Общая площадь использованного материала' })
  totalMaterialArea!: number;

  @ApiProperty({
    type: [UnplacedPartInfoDto],
    description: 'Детали, которые не удалось разместить',
  })
  unplacedParts!: UnplacedPartInfoDto[];

  @ApiProperty({ description: 'Удалось ли разместить все детали' })
  isComplete!: boolean;
}
