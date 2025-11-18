import { Module } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

@Module({
  providers: [ApiKeyGuard],
})
export class AuthModule {}
