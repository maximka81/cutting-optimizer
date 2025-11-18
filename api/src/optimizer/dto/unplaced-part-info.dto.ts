import { ApiProperty } from '@nestjs/swagger';

export class UnplacedPartInfoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  length!: number;

  @ApiProperty()
  width!: number;

  @ApiProperty()
  color!: string;

  @ApiProperty()
  thickness!: number;

  @ApiProperty({ description: 'Количество одинаковых неразмещённых деталей' })
  quantity!: number;

  @ApiProperty()
  square!: number;

  @ApiProperty({ description: 'Причина неразмещения', required: false })
  reason?: string;
}
