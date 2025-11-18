import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from './api-key.guard';

// Mock для CustomLogger
jest.mock('src/logger/custom.logger', () => {
  return {
    CustomLogger: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    })),
  };
});

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService({
      API_KEY: 'test-secret-key',
    });
    guard = new ApiKeyGuard(configService);
  });

  const createMockExecutionContext = (apiKey?: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            'x-api-key': apiKey,
          },
        }),
      }),
    } as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access with valid API key', async () => {
    const context = createMockExecutionContext('test-secret-key');
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException with invalid API key', async () => {
    const context = createMockExecutionContext('wrong-key');
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when API key is missing', async () => {
    const context = createMockExecutionContext(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw Error when API_KEY is not configured', async () => {
    const emptyConfigService = new ConfigService({});
    const guardWithoutKey = new ApiKeyGuard(emptyConfigService);
    const context = createMockExecutionContext('any-key');

    await expect(guardWithoutKey.canActivate(context)).rejects.toThrow('API_KEY не задан в .env');
  });
});
