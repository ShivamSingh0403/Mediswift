import { create } from 'zustand';

interface FilterStore {
  searchQuery: string;
  categorySlug: string | null;
  brandSlug: string | null;
  prescriptionRequiredOnly: boolean | null;
  minPrice: number | null;
  maxPrice: number | null;
  setSearchQuery: (q: string) => void;
  setCategory: (slug: string | null) => void;
  setBrand: (slug: string | null) => void;
  setPrescriptionFilter: (val: boolean | null) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  searchQuery: '',
  categorySlug: null,
  brandSlug: null,
  prescriptionRequiredOnly: null,
  minPrice: null,
  maxPrice: null,

  setSearchQuery: (q) => set({ searchQuery: q }),
  setCategory: (slug) => set({ categorySlug: slug }),
  setBrand: (slug) => set({ brandSlug: slug }),
  setPrescriptionFilter: (val) => set({ prescriptionRequiredOnly: val }),
  setPriceRange: (min, max) => set({ minPrice: min, maxPrice: max }),
  resetFilters: () =>
    set({
      searchQuery: '',
      categorySlug: null,
      brandSlug: null,
      prescriptionRequiredOnly: null,
      minPrice: null,
      maxPrice: null,
    }),
}));
