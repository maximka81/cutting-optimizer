import { PartDto } from 'src/optimizer/dto';

export interface InternalPartDto extends PartDto {
  splitGroupId?: string;
  tag?: string;
}

export interface CoilSection {
  length: number;
  width: number;
  usedLength: number;
  remainingLength: number;
  cutLine?: number;
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
  originalId: string;
  splitGroupId?: string;
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

export interface PackerOptions {
  width: number;
  height: number;
  padding: number;
  options: {
    smart: boolean;
    pot: boolean;
    square: boolean;
    allowRotation: boolean;
  };
}
