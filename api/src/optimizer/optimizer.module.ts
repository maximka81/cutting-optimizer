import { Module } from '@nestjs/common';

import { OptimizerController } from './optimizer.controller';
import { OptimizerService } from './optimizer.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OptimizerController],
  providers: [OptimizerService],
})
export class OptimizerModule {}
