import { Material } from '@/entities/material/model/types';
import { Part } from '@/entities/part/model/types';

export interface OptimizationOptionsDto {
  minWaste: boolean;
  maxUtilization: boolean;
  smartPack: boolean;
  useInfiniteMaterials: boolean;
}

export interface OptimizationInput {
  parts: Part[];
  availableMaterials?: Material[];
  options: OptimizationOptionsDto;
}

export interface PlacedPart {
  id: string;
  length: number;
  width: number;
  color: string;
  thickness: number;
  x: number;
  y: number;
  square: number;
  rotated: boolean;
  label: string;
  description: string;
  originalId: number;
}

export interface SheetResult {
  length: number;
  width: number;
  color: string;
  thickness: number;
  parts: PlacedPart[];
  waste: {
    square: number;
    utilizationRate: number;
  };
}

export interface OptimizationResult {
  sheets: SheetResult[];
  totalWaste: number;
  waste: {
    color: string;
    thickness: number;
    square: number;
  }[];
  utilizationRate: number;
  totalMaterialArea: number;
  unplacedParts: UnplacedPartInfo[]; // Информация о неразмещенных деталях
  isComplete: boolean; // Флаг, показывающий, удалось ли разместить все детали
  method: string; // Метод, использованный для оптимизации
}

export interface UnplacedPartInfo {
  id: string;
  length: number;
  width: number;
  color: string;
  thickness: number;
  quantity: number;
  square: number;
  reason?: string;
}
