import { MaxRectsPacker, Rectangle } from 'maxrects-packer';
import { CustomLogger } from '../logger/custom.logger';

import {
  INFINITE_MATERIAL_WIDTH,
  MAX_MACHINE_SIZE,
  PADDING_DETAILS_ON_SHEET,
} from '../shared/constants';
import {
  MaterialDto,
  OptimizationInputDto,
  OptimizationOptionsDto,
  PartDto,
} from '../optimizer/dto';
import {
  InternalPartDto,
  OptimizationResult,
  PackerOptions,
  PlacedPart,
  SheetResult,
  UnplacedPartInfo,
} from '../shared/types';

export class CuttingOptimizer {
  private packerOptionsCache = new Map<string, PackerOptions>();
  private logger = new CustomLogger('CuttingOptimizer');

  private optimizeParts(
    parts: InternalPartDto[],
    materials: MaterialDto[],
    options: OptimizationOptionsDto,
    result: SheetResult[],
  ): InternalPartDto[] {
    let remainingParts = [...parts];

    for (const material of materials) {
      if (!remainingParts.length) break;

      let currentCutLine = 0;
      while (remainingParts.length > 0) {
        const { sectionLength, sectionParts } = this.calculateOptimalSection(
          remainingParts,
          material.width,
        );

        if (!sectionLength) break;

        const sheetFromMaterial = this.createMaterialSection(
          material,
          result.length,
          sectionLength,
        );
        const packingResult = this.packPartsOnSheet(sectionParts, sheetFromMaterial, options);

        if (packingResult.parts.length > 0) {
          currentCutLine += sectionLength;
          result.push(packingResult);
          remainingParts = this.filterRemainingParts(remainingParts, packingResult.parts);
        } else {
          break;
        }
      }
    }
    return remainingParts;
  }

  private calculateOptimalSection(
    parts: InternalPartDto[],
    materialWidth: number,
  ): { sectionLength: number; sectionParts: InternalPartDto[] } {
    const sortedParts = [...parts].sort(
      (a, b) => Math.max(b.length, b.width) - Math.max(a.length, a.width),
    );

    const sectionParts = sortedParts.filter((part) => {
      const [partLength, partWidth] = [
        Math.max(part.length, part.width),
        Math.min(part.length, part.width),
      ];
      return partWidth <= materialWidth && partLength <= MAX_MACHINE_SIZE;
    });

    const maxLength = sectionParts.length
      ? Math.min(
          Math.max(...sectionParts.map((p) => Math.max(p.length, p.width))),
          MAX_MACHINE_SIZE,
        )
      : 0;

    return { sectionLength: maxLength, sectionParts };
  }

  optimizeCutting(input: OptimizationInputDto): OptimizationResult {
    const { parts, availableMaterials, options } = input;
    const expandedParts = this.expandPartsByQuantity(parts);
    const partGroups = this.groupPartsByColorAndThickness(expandedParts);

    const result: SheetResult[] = [];
    const unplacedParts: UnplacedPartInfo[] = [];

    Object.entries(partGroups).map(([key, groupParts]) => {
      const [color, thickness] = key.split('-');
      const materials = options.useInfiniteMaterials
        ? this.createInfiniteMaterial(color, Number(thickness))
        : this.filterMaterialsByProperties(availableMaterials || [], color, Number(thickness));

      const remainingParts = this.optimizeParts(groupParts, materials, options, result);

      if (remainingParts.length > 0) {
        unplacedParts.push(...this.consolidateUnplacedParts(remainingParts));
      }
    });

    return this.createOptimizationResult(result, unplacedParts);
  }

  protected packPartsOnSheet(
    parts: InternalPartDto[],
    sheet: MaterialDto,
    options: OptimizationOptionsDto,
  ): SheetResult {
    const packerOptions = this.getPackerOptions(sheet, options);
    const packer = new MaxRectsPacker(
      packerOptions.width,
      packerOptions.height,
      packerOptions.padding,
      packerOptions.options,
    );

    const rectangles = parts.map((part) => ({
      width: part.length,
      height: part.width,
      allowRotation: part.canRotate,
      _allowRotation: part.canRotate,
      data: part,
    }));

    packer.addArray(rectangles as unknown as Rectangle[]);

    if (!packer.bins?.[0]?.rects?.length) {
      return this.createEmptySheetResult(sheet);
    }

    const placedParts = this.createPlacedParts(packer.bins[0].rects, sheet);
    return this.createSheetResult(sheet, placedParts);
  }

  protected consolidateUnplacedParts(parts: InternalPartDto[]): UnplacedPartInfo[] {
    return parts.map((part) => ({
      id: part.id,
      length: part.length,
      width: part.width,
      color: part.color,
      thickness: part.thickness,
      quantity: part.quantity,
      square: part.length * part.width,
      reason: this.getUnplacedReason(part),
    }));
  }

  protected getUnplacedReason(part: InternalPartDto): string {
    return part.length > MAX_MACHINE_SIZE || part.width > MAX_MACHINE_SIZE
      ? 'Размеры детали превышают максимальные размеры станка'
      : 'Не найден подходящий материал';
  }

  protected createOptimizationResult(
    sheets: SheetResult[],
    unplacedParts: UnplacedPartInfo[],
  ): OptimizationResult {
    const totalWaste = sheets.reduce((sum, sheet) => sum + sheet.waste.square, 0);
    const utilizationRate = this.calculateUtilizationRate(sheets);
    const totalMaterialArea = sheets.reduce((sum, sheet) => sum + sheet.length * sheet.width, 0);

    // Группировка отходов по цвету и толщине
    const wasteByColorAndThickness = sheets.reduce<Record<string, Record<number, number>>>(
      (acc, sheet) => {
        if (!acc[sheet.color]) {
          acc[sheet.color] = {};
        }
        acc[sheet.color][sheet.thickness] =
          (acc[sheet.color][sheet.thickness] || 0) + sheet.waste.square;
        return acc;
      },
      {},
    );

    const wasteByColorAndThicknessArray = Object.entries(wasteByColorAndThickness).flatMap(
      ([color, thicknessMap]) =>
        Object.entries(thicknessMap).map(([thickness, square]) => ({
          color,
          thickness: Number(thickness),
          square,
        })),
    );

    const result = {
      sheets,
      totalWaste,
      waste: wasteByColorAndThicknessArray,
      utilizationRate,
      totalMaterialArea,
      unplacedParts,
      isComplete: unplacedParts.length === 0,
    };

    // this.logger.debug(`Cutting optimization result: ${JSON.stringify(result)}`);

    return result;
  }

  protected calculateUtilizationRate(sheets: SheetResult[]): number {
    if (!sheets.length) return 0;

    const totalArea = sheets.reduce((sum, sheet) => sum + sheet.length * sheet.width, 0);
    const totalUsedArea = sheets.reduce(
      (sum, sheet) => sum + sheet.parts.reduce((s, p) => s + p.square, 0),
      0,
    );

    return totalArea > 0 ? (totalUsedArea / totalArea) * 100 : 0;
  }

  protected createMaterialSection(
    material: MaterialDto,
    index: number,
    length: number,
  ): MaterialDto {
    return {
      id: `${material.id}_${index}`,
      length,
      width: material.width,
      color: material.color,
      thickness: material.thickness,
      availableQuantity: 1,
    };
  }

  protected filterRemainingParts(
    parts: InternalPartDto[],
    placedParts: PlacedPart[],
  ): InternalPartDto[] {
    const placedIds = new Set(placedParts.map((p) => p.id));
    return parts.filter((part) => !placedIds.has(part.id));
  }

  protected createSheetResult(sheet: MaterialDto, placedParts: PlacedPart[]): SheetResult {
    const sheetArea = sheet.length * sheet.width;
    const usedArea = placedParts.reduce((sum, part) => sum + part.square, 0);

    return {
      length: sheet.length,
      width: sheet.width,
      color: sheet.color,
      thickness: sheet.thickness,
      parts: placedParts,
      waste: {
        square: sheetArea - usedArea,
        utilizationRate: (usedArea / sheetArea) * 100,
      },
    };
  }

  protected createPlacedParts(rects: Rectangle[], sheet: MaterialDto): PlacedPart[] {
    return rects
      .filter((rect) => rect.x >= 0 && rect.y >= 0)
      .map((rect) => {
        const part = rect.data as InternalPartDto;
        return {
          id: part.id,
          length: rect.width,
          width: rect.height,
          x: rect.x,
          y: rect.y,
          square: rect.width * rect.height,
          color: sheet.color,
          thickness: sheet.thickness,
          rotated: rect.rot,
          label: part.label,
          description: part.description,
          originalId: part.id.split('_')[0],
          splitGroupId: part.splitGroupId,
        };
      });
  }

  protected createEmptySheetResult(sheet: MaterialDto): SheetResult {
    return {
      length: sheet.length,
      width: sheet.width,
      color: sheet.color,
      thickness: sheet.thickness,
      parts: [],
      waste: { square: sheet.length * sheet.width, utilizationRate: 0 },
    };
  }

  protected groupPartsByColorAndThickness(
    parts: InternalPartDto[],
  ): Record<string, InternalPartDto[]> {
    return parts.reduce((groups: Record<string, InternalPartDto[]>, part) => {
      const key = `${part.color}-${part.thickness}`;
      groups[key] = groups[key] || [];
      groups[key].push(part);
      return groups;
    }, {});
  }

  protected getPackerOptions(sheet: MaterialDto, options: OptimizationOptionsDto): PackerOptions {
    const key = `${sheet.id}_${sheet.length}_${sheet.width}_${options.smartPack}`;

    if (!this.packerOptionsCache.has(key)) {
      this.packerOptionsCache.set(key, {
        width: Math.min(sheet.length, MAX_MACHINE_SIZE),
        height: Math.min(sheet.width, MAX_MACHINE_SIZE),
        padding: PADDING_DETAILS_ON_SHEET,
        options: {
          smart: options.smartPack ?? true,
          pot: false,
          square: false,
          allowRotation: true,
        },
      });
    }

    return this.packerOptionsCache.get(key)!;
  }

  protected createInfiniteMaterial(color: string, thickness: number): MaterialDto[] {
    return [
      {
        id: `infinite_${color}_${thickness}`,
        length: Number.MAX_SAFE_INTEGER, // Практически бесконечная длина
        width: INFINITE_MATERIAL_WIDTH,
        color,
        thickness,
        availableQuantity: 1,
      },
    ];
  }

  protected filterMaterialsByProperties(
    materials: MaterialDto[],
    color: string,
    thickness: number,
  ): MaterialDto[] {
    return materials.filter((m) => m.color === color && m.thickness === thickness);
  }

  protected expandPartsByQuantity(parts: PartDto[]): InternalPartDto[] {
    return parts.flatMap((part) => {
      const quantity = part.quantity || 1;
      const expandedParts: InternalPartDto[] = [];

      // Разбиваем длинные детали
      if (part.length > MAX_MACHINE_SIZE) {
        const numParts = Math.ceil(part.length / MAX_MACHINE_SIZE);
        const splitLength = Math.ceil(part.length / numParts);
        const splitGroupId = part.id; // Используем id оригинальной детали как групповой идентификатор

        for (let i = 0; i < numParts; i++) {
          for (let j = 0; j < quantity; j++) {
            expandedParts.push({
              ...part,
              id: `${part.id}_${j}_${i}`,
              length: splitLength,
              quantity: 1,
              splitGroupId,
            });
          }
        }
      } else {
        // Обычное размножение деталей по quantity
        for (let i = 0; i < quantity; i++) {
          expandedParts.push({
            ...part,
            id: `${part.id}_${i}`,
            quantity: 1,
          });
        }
      }

      return expandedParts;
    });
  }
}
