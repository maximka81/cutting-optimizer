import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { CustomLogger } from './logger/custom.logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLogger(),
  });

  const config = new DocumentBuilder()
    .setTitle('Cutting optimizer API')
    .setDescription('The cutting optimizer API description')
    .setVersion('1.0')
    .addTag('opticut')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-KEY',
        in: 'header',
        description: 'Enter your API key',
      },
      'X-API-KEY',
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Удаляем неописанные в DTO поля
      forbidNonWhitelisted: true, // Запрещаем неописанные поля
      transform: true, // Автоматически преобразуем типы
      disableErrorMessages: false, // Показываем сообщения об ошибках
    }),
  );

  app.enableCors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key'],
  });

  await app.listen(process.env.PORT ?? 3010);
}
void bootstrap();
