import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module';

describe('OptimizerController (e2e)', () => {
  let app: INestApplication;
  let apiKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Получаем API ключ из конфигурации
    const configService = app.get(ConfigService);
    apiKey = configService.get<string>('API_KEY') || 'test-api-key';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/optimizer (POST)', () => {
    it('should return 401 without API key', () => {
      return request(app.getHttpServer())
        .post('/api/optimizer')
        .send({
          parts: [
            {
              id: '1',
              length: 1000,
              width: 500,
              color: '9003',
              thickness: 0.45,
              quantity: 1,
              canRotate: true,
              label: 'Test',
              description: 'Test Part',
            },
          ],
          options: {
            minWaste: true,
            maxUtilization: false,
            smartPack: true,
            useInfiniteMaterials: true,
          },
        })
        .expect(401);
    });

    it('should return 401 with invalid API key', () => {
      return request(app.getHttpServer())
        .post('/api/optimizer')
        .set('X-API-KEY', 'invalid-key')
        .send({
          parts: [
            {
              id: '1',
              length: 1000,
              width: 500,
              color: '9003',
              thickness: 0.45,
              quantity: 1,
              canRotate: true,
              label: 'Test',
              description: 'Test Part',
            },
          ],
          options: {
            minWaste: true,
            maxUtilization: false,
            smartPack: true,
            useInfiniteMaterials: true,
          },
        })
        .expect(401);
    });

    it('should optimize cutting with valid input', () => {
      return request(app.getHttpServer())
        .post('/api/optimizer')
        .set('X-API-KEY', apiKey)
        .send({
          parts: [
            {
              id: '1',
              length: 1000,
              width: 500,
              color: '9003',
              thickness: 0.45,
              quantity: 2,
              canRotate: true,
              label: 'Test Part',
              description: 'Test Description',
            },
          ],
          options: {
            minWaste: true,
            maxUtilization: false,
            smartPack: true,
            useInfiniteMaterials: true,
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('sheets');
          expect(res.body).toHaveProperty('totalWaste');
          expect(res.body).toHaveProperty('utilizationRate');
          expect(res.body).toHaveProperty('isComplete');
          expect(res.body.isComplete).toBe(true);
          expect(res.body.sheets.length).toBeGreaterThan(0);
        });
    });

    it('should return 400 for invalid part data (missing required fields)', () => {
      return request(app.getHttpServer())
        .post('/api/optimizer')
        .set('X-API-KEY', apiKey)
        .send({
          parts: [
            {
              id: '1',
              length: 1000,
              // Отсутствует width
              color: '9003',
              thickness: 0.45,
              quantity: 1,
            },
          ],
          options: {
            minWaste: true,
            maxUtilization: false,
            smartPack: true,
            useInfiniteMaterials: true,
          },
        })
        .expect(400);
    });

    it('should return 400 for invalid part data (negative dimensions)', () => {
      return request(app.getHttpServer())
        .post('/api/optimizer')
        .set('X-API-KEY', apiKey)
        .send({
          parts: [
            {
              id: '1',
              length: -1000, // Отрицательное значение
              width: 500,
              color: '9003',
              thickness: 0.45,
              quantity: 1,
              canRotate: true,
              label: 'Test',
              description: 'Test',
            },
          ],
          options: {
            minWaste: true,
            maxUtilization: false,
            smartPack: true,
            useInfiniteMaterials: true,
          },
        })
        .expect(400);
    });

    it('should handle multiple parts with different colors and thicknesses', () => {
      return request(app.getHttpServer())
        .post('/api/optimizer')
        .set('X-API-KEY', apiKey)
        .send({
          parts: [
            {
              id: '1',
              length: 1000,
              width: 500,
              color: '9003',
              thickness: 0.45,
              quantity: 1,
              canRotate: true,
              label: 'Part 1',
              description: 'White',
            },
            {
              id: '2',
              length: 1200,
              width: 600,
              color: '9006',
              thickness: 0.5,
              quantity: 1,
              canRotate: true,
              label: 'Part 2',
              description: 'Grey',
            },
          ],
          options: {
            minWaste: true,
            maxUtilization: false,
            smartPack: true,
            useInfiniteMaterials: true,
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.sheets.length).toBeGreaterThanOrEqual(2);
          expect(res.body.isComplete).toBe(true);

          // Проверяем, что есть листы разных цветов
          const colors = new Set(res.body.sheets.map((s: any) => s.color));
          expect(colors.size).toBeGreaterThan(1);
        });
    });

    it('should handle parts with large quantities', () => {
      return request(app.getHttpServer())
        .post('/api/optimizer')
        .set('X-API-KEY', apiKey)
        .send({
          parts: [
            {
              id: '1',
              length: 500,
              width: 300,
              color: '9003',
              thickness: 0.45,
              quantity: 10,
              canRotate: true,
              label: 'Small Part',
              description: 'Many pieces',
            },
          ],
          options: {
            minWaste: true,
            maxUtilization: false,
            smartPack: true,
            useInfiniteMaterials: true,
          },
        })
        .expect(201)
        .expect((res) => {
          const totalParts = res.body.sheets.reduce(
            (sum: number, sheet: any) => sum + sheet.parts.length,
            0,
          );
          expect(totalParts).toBe(10);
          expect(res.body.isComplete).toBe(true);
        });
    });

    it('should return waste information grouped by color and thickness', () => {
      return request(app.getHttpServer())
        .post('/api/optimizer')
        .set('X-API-KEY', apiKey)
        .send({
          parts: [
            {
              id: '1',
              length: 1000,
              width: 500,
              color: '9003',
              thickness: 0.45,
              quantity: 1,
              canRotate: true,
              label: 'Test',
              description: 'Test',
            },
          ],
          options: {
            minWaste: true,
            maxUtilization: false,
            smartPack: true,
            useInfiniteMaterials: true,
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('waste');
          expect(Array.isArray(res.body.waste)).toBe(true);

          if (res.body.waste.length > 0) {
            expect(res.body.waste[0]).toHaveProperty('color');
            expect(res.body.waste[0]).toHaveProperty('thickness');
            expect(res.body.waste[0]).toHaveProperty('square');
          }
        });
    });
  });
});
