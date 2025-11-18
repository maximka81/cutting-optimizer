import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { Material } from '@/entities/material/model/types';
import { Part } from '@/entities/part/model/types';
import { OptimizationOptionsDto } from '@/shared/api/optimizer.dto';
import { defaultOpticutInput } from '../lib/defaultOpticutData';

interface Store {
  parts: Part[];
  materials: Material[];
  options: OptimizationOptionsDto;
  setParts: (parts: Part[]) => void;
  addPart: (part: Omit<Part, 'id'>) => void;
  clearParts: () => void;
  setMaterials: (materials: Material[]) => void;
  addMaterial: (material: Omit<Material, 'id'>) => void;
  setOptions: (options: OptimizationOptionsDto) => void;
}

const useStore = create<Store>((set) => ({
  parts: [],
  materials: defaultOpticutInput().data.availableMaterials ?? [],
  options: defaultOpticutInput().data.options,
  setParts: (parts: Part[]) => set({ parts }),
  addPart: (part) =>
    set((state) => {
      const newId =
        state.parts.length > 0 ? Math.max(...state.parts.map((p) => parseInt(p.id))) + 1 : 1;
      const newPart = { ...part, id: newId.toString() };
      return { parts: [...state.parts, newPart] };
    }),
  clearParts: () => set({ parts: [] }),
  setMaterials: (materials: Material[]) => set({ materials }),
  addMaterial: (material) =>
    set((state) => {
      const materials = state.materials || [];
      const newId =
        materials.length > 0 ? Math.max(...materials.map((m) => parseInt(m.id))) + 1 : 1;
      const newMaterial = { ...material, id: newId.toString() };
      return { materials: [...materials, newMaterial] };
    }),
  setOptions: (newOptions: OptimizationOptionsDto) => set({ options: newOptions }),
}));

export const useParts = () => useStore(useShallow((state) => state.parts));
export const useMaterials = () => useStore(useShallow((state) => state.materials));
export const useOptions = () => useStore(useShallow((state) => state.options));

export default useStore;
