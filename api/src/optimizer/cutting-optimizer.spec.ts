import { CuttingOptimizer } from './cutting-optimizer';
import { MaterialDto, PartDto } from './dto';

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

describe('CuttingOptimizer', () => {
  let optimizer: CuttingOptimizer;

  beforeEach(() => {
    optimizer = new CuttingOptimizer();
  });

  describe('expandPartsByQuantity', () => {
    it('should expand parts by quantity', () => {
      const parts: PartDto[] = [
        {
          id: '1',
          length: 1000,
          width: 500,
          color: '9003',
          thickness: 0.45,
          quantity: 3,
          canRotate: true,
          label: 'Test',
          description: 'Test Part',
        },
      ];

      const expanded = optimizer['expandPartsByQuantity'](parts);

      expect(expanded).toHaveLength(3);
      expect(expanded[0].id).toBe('1_0');
      expect(expanded[1].id).toBe('1_1');
      expect(expanded[2].id).toBe('1_2');
    });

    it('should split long parts exceeding MAX_MACHINE_SIZE', () => {
      const parts: PartDto[] = [
        {
          id: '1',
          length: 7000, // > 3000
          width: 500,
          color: '9003',
          thickness: 0.45,
          quantity: 1,
          canRotate: false,
          label: 'Long',
          description: 'Long Part',
        },
      ];

      const expanded = optimizer['expandPartsByQuantity'](parts);

      // Должно быть создано несколько частей
      expect(expanded.length).toBeGreaterThan(1);

      // Проверяем, что у всех частей есть splitGroupId
      expanded.forEach((part) => {
        expect(part.splitGroupId).toBe('1');
        expect(part.length).toBeLessThanOrEqual(3000); // MAX_MACHINE_SIZE
      });
    });
  });

  describe('groupPartsByColorAndThickness', () => {
    it('should group parts by color and thickness', () => {
      const parts = [
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
          length: 1000,
          width: 500,
          color: '9003',
          thickness: 0.45,
          quantity: 1,
          canRotate: true,
          label: 'Part 2',
          description: 'Test',
        },
        {
          id: '3',
          length: 1000,
          width: 500,
          color: '9006',
          thickness: 0.5,
          quantity: 1,
          canRotate: true,
          label: 'Part 3',
          description: 'Test',
        },
      ];

      const grouped = optimizer['groupPartsByColorAndThickness'](parts);

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['9003-0.45']).toHaveLength(2);
      expect(grouped['9006-0.5']).toHaveLength(1);
    });
  });

  describe('createInfiniteMaterial', () => {
    it('should create infinite material with correct properties', () => {
      const materials = optimizer['createInfiniteMaterial']('9003', 0.45);

      expect(materials).toHaveLength(1);
      expect(materials[0].color).toBe('9003');
      expect(materials[0].thickness).toBe(0.45);
      expect(materials[0].length).toBe(Number.MAX_SAFE_INTEGER);
      expect(materials[0].width).toBe(1250); // INFINITE_MATERIAL_WIDTH
    });
  });

  describe('filterMaterialsByProperties', () => {
    it('should filter materials by color and thickness', () => {
      const materials: MaterialDto[] = [
        {
          id: '1',
          length: 5000,
          width: 1250,
          color: '9003',
          thickness: 0.45,
          availableQuantity: 10,
        },
        {
          id: '2',
          length: 5000,
          width: 1250,
          color: '9006',
          thickness: 0.5,
          availableQuantity: 5,
        },
        {
          id: '3',
          length: 5000,
          width: 1250,
          color: '9003',
          thickness: 0.5,
          availableQuantity: 3,
        },
      ];

      const filtered = optimizer['filterMaterialsByProperties'](materials, '9003', 0.45);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });
  });

  describe('calculateUtilizationRate', () => {
    it('should calculate utilization rate correctly', () => {
      const sheets = [
        {
          length: 2000,
          width: 1000,
          color: '9003',
          thickness: 0.45,
          parts: [
            {
              id: '1',
              length: 1000,
              width: 500,
              square: 500000,
              x: 0,
              y: 0,
              color: '9003',
              thickness: 0.45,
              rotated: false,
              label: 'Part',
              description: 'Test',
              originalId: '1',
            },
          ],
          waste: { square: 1500000, utilizationRate: 25 },
        },
      ];

      const rate = optimizer['calculateUtilizationRate'](sheets);

      expect(rate).toBe(25); // 500000 / 2000000 * 100
    });

    it('should return 0 for empty sheets array', () => {
      const rate = optimizer['calculateUtilizationRate']([]);
      expect(rate).toBe(0);
    });
  });

  describe('consolidateUnplacedParts', () => {
    it('should consolidate unplaced parts with reasons', () => {
      const parts = [
        {
          id: '1',
          length: 5000,
          width: 2000,
          color: '9003',
          thickness: 0.45,
          quantity: 1,
          canRotate: true,
          label: 'Too Big',
          description: 'Exceeds machine size',
        },
      ];

      const unplaced = optimizer['consolidateUnplacedParts'](parts);

      expect(unplaced).toHaveLength(1);
      expect(unplaced[0].reason).toBe('Размеры детали превышают максимальные размеры станка');
    });
  });

  describe('createMaterialSection', () => {
    it('should create material section with correct properties', () => {
      const material: MaterialDto = {
        id: 'mat1',
        length: 5000,
        width: 1250,
        color: '9003',
        thickness: 0.45,
        availableQuantity: 10,
      };

      const section = optimizer['createMaterialSection'](material, 0, 2500);

      expect(section.id).toBe('mat1_0');
      expect(section.length).toBe(2500);
      expect(section.width).toBe(1250);
      expect(section.color).toBe('9003');
      expect(section.thickness).toBe(0.45);
    });
  });
});
