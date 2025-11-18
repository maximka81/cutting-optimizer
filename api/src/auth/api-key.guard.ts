import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'.toLowerCase()];

    const expectedKey = this.configService.get<string>('API_KEY');
    if (!expectedKey) {
      throw new Error('API_KEY не задан в .env');
    }

    if (!apiKey || apiKey !== expectedKey) {
      throw new UnauthorizedException('Неверный или отсутствующий API-ключ');
    }

    return true;
  }
}
