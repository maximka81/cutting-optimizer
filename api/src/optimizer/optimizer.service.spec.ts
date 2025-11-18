import { Test, TestingModule } from '@nestjs/testing';
import { OptimizerService } from './optimizer.service';
import { OptimizationInputDto } from './dto';

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

describe('OptimizerService', () => {
  let service: OptimizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OptimizerService],
    }).compile();

    service = module.get<OptimizerService>(OptimizerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('optimizeCutting', () => {
    it('should return optimization result with placed parts', () => {
      const input: OptimizationInputDto = {
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
      };

      const result = service.optimizeCutting(input);

      expect(result).toBeDefined();
      expect(result.sheets).toBeDefined();
      expect(result.sheets.length).toBeGreaterThan(0);
      expect(result.isComplete).toBe(true);
      expect(result.unplacedParts).toHaveLength(0);
    });

    it('should handle parts with rotation', () => {
      const input: OptimizationInputDto = {
        parts: [
          {
            id: '1',
            length: 2000,
            width: 100,
            color: '9003',
            thickness: 0.45,
            quantity: 1,
            canRotate: true,
            label: 'Rotatable',
            description: 'Can be rotated',
          },
        ],
        options: {
          minWaste: true,
          maxUtilization: false,
          smartPack: true,
          useInfiniteMaterials: true,
        },
      };

      const result = service.optimizeCutting(input);

      expect(result.isComplete).toBe(true);
      expect(result.sheets[0].parts.length).toBeGreaterThan(0);
    });

    it('should split parts exceeding MAX_MACHINE_SIZE', () => {
      const input: OptimizationInputDto = {
        parts: [
          {
            id: '1',
            length: 7000, // Больше MAX_MACHINE_SIZE (3000)
            width: 500,
            color: '9003',
            thickness: 0.45,
            quantity: 1,
            canRotate: false,
            label: 'Long Part',
            description: 'Should be split',
          },
        ],
        options: {
          minWaste: true,
          maxUtilization: false,
          smartPack: true,
          useInfiniteMaterials: true,
        },
      };

      const result = service.optimizeCutting(input);

      // Проверяем, что детали были размещены (после разбиения)
      expect(result.sheets.length).toBeGreaterThan(0);

      // Проверяем наличие splitGroupId у размещенных деталей
      const allParts = result.sheets.flatMap((sheet) => sheet.parts);
      const splitParts = allParts.filter((part) => part.splitGroupId);
      expect(splitParts.length).toBeGreaterThan(1);
    });

    it('should calculate waste and utilization correctly', () => {
      const input: OptimizationInputDto = {
        parts: [
          {
            id: '1',
            length: 1000,
            width: 500,
            color: '9003',
            thickness: 0.45,
            quantity: 1,
            canRotate: true,
            label: 'Part',
            description: 'Test',
          },
        ],
        options: {
          minWaste: true,
          maxUtilization: false,
          smartPack: true,
          useInfiniteMaterials: true,
        },
      };

      const result = service.optimizeCutting(input);

      expect(result.totalWaste).toBeGreaterThanOrEqual(0);
      expect(result.utilizationRate).toBeGreaterThan(0);
      expect(result.utilizationRate).toBeLessThanOrEqual(100);
    });

    it('should group waste by color and thickness', () => {
      const input: OptimizationInputDto = {
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
            description: 'Test',
          },
          {
            id: '2',
            length: 800,
            width: 400,
            color: '9006',
            thickness: 0.5,
            quantity: 1,
            canRotate: true,
            label: 'Part 2',
            description: 'Test',
          },
        ],
        options: {
          minWaste: true,
          maxUtilization: false,
          smartPack: true,
          useInfiniteMaterials: true,
        },
      };

      const result = service.optimizeCutting(input);

      expect(result.waste).toBeDefined();
      expect(Array.isArray(result.waste)).toBe(true);

      // Проверяем, что отходы сгруппированы
      result.waste.forEach((wasteItem) => {
        expect(wasteItem).toHaveProperty('color');
        expect(wasteItem).toHaveProperty('thickness');
        expect(wasteItem).toHaveProperty('square');
      });
    });

    it('should handle multiple quantities correctly', () => {
      const input: OptimizationInputDto = {
        parts: [
          {
            id: '1',
            length: 500,
            width: 300,
            color: '9003',
            thickness: 0.45,
            quantity: 5, // Несколько штук
            canRotate: true,
            label: 'Multiple',
            description: 'Multiple parts',
          },
        ],
        options: {
          minWaste: true,
          maxUtilization: false,
          smartPack: true,
          useInfiniteMaterials: true,
        },
      };

      const result = service.optimizeCutting(input);

      const totalPlacedParts = result.sheets.reduce((sum, sheet) => sum + sheet.parts.length, 0);

      expect(totalPlacedParts).toBe(5);
      expect(result.isComplete).toBe(true);
    });
  });
});
