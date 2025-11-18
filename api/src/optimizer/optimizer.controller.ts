import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiExtraModels } from '@nestjs/swagger';
import { OptimizationResultDto } from './dto/optimization-result.dto';
import { OptimizerService } from './optimizer.service';

import { OptimizationInputDto, PlacedPartDto, SheetResultDto, UnplacedPartInfoDto } from './dto';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('optimizer')
@ApiExtraModels(PlacedPartDto, SheetResultDto, UnplacedPartInfoDto, OptimizationResultDto)
@Controller('optimizer')
@UseGuards(ApiKeyGuard)
export class OptimizerController {
  constructor(private readonly optimizerService: OptimizerService) {}

  @Post()
  @ApiOperation({
    summary: 'Оптимизация раскроя деталей на листовом материале',
    description: `
      Вычисляет оптимальное размещение деталей на листах/рулонах с учётом:
      - поворота деталей (если разрешено)
      - бесконечных материалов (если useInfiniteMaterials = true)
      - разбиения длинных деталей (> 3000 мм)
      - минимизации отходов / максимального использования (в зависимости от опций)
      
      Алгоритм использует MaxRectsPacker (bin packing).
      Возвращает полную карту раскроя, отходы и список неразмещённых деталей.
    `,
  })
  @ApiBody({
    type: OptimizationInputDto,
    examples: {
      example1: {
        summary: 'Простой пример с бесконечным материалом',
        value: {
          parts: [
            {
              id: '1',
              length: 2500,
              width: 150,
              color: '9003',
              thickness: 0.45,
              quantity: 4,
              canRotate: true,
              label: '',
              description: 'Конек',
            },
            {
              id: '2',
              length: 2500,
              width: 542,
              color: '9003',
              thickness: 0.45,
              quantity: 2,
              canRotate: true,
              label: '',
              description: 'Угол наружный сложный',
            },
          ],
          options: {
            minWaste: true,
            maxUtilization: false,
            smartPack: true,
            useInfiniteMaterials: true,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный результат оптимизации',
    type: OptimizationResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные входные данные (валидация не пройдена)',
  })
  @ApiResponse({
    status: 500,
    description: 'Ошибка сервера (например, слишком большие данные)',
  })
  optimize(@Body() dto: OptimizationInputDto): OptimizationResultDto {
    const result = this.optimizerService.optimizeCutting(dto);
    return result;
  }
}
