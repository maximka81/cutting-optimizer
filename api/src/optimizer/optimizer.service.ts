import { Injectable } from '@nestjs/common';

import { OptimizationResult } from '../shared/types';

import { CuttingOptimizer } from './cutting-optimizer';
import { OptimizationInputDto } from './dto';

@Injectable()
export class OptimizerService {
  optimizeCutting(input: OptimizationInputDto): OptimizationResult {
    return new CuttingOptimizer().optimizeCutting(input);
  }
}
