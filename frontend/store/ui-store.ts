import { create } from 'zustand';
import { Product } from '@/types';

interface UiStore {
  isMobileMenuOpen: boolean;
  isPrescriptionModalOpen: boolean;
  isCartDrawerOpen: boolean;
  isSearchOverlayOpen: boolean;
  quickViewProduct: Product | null;
  activePincode: string;
  cityName: string;
  setMobileMenuOpen: (open: boolean) => void;
  setPrescriptionModalOpen: (open: boolean) => void;
  setCartDrawerOpen: (open: boolean) => void;
  setSearchOverlayOpen: (open: boolean) => void;
  setQuickViewProduct: (product: Product | null) => void;
  setPincode: (pincode: string, city?: string) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  isMobileMenuOpen: false,
  isPrescriptionModalOpen: false,
  isCartDrawerOpen: false,
  isSearchOverlayOpen: false,
  quickViewProduct: null,
  activePincode: '380054',
  cityName: 'Ahmedabad',

  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  setPrescriptionModalOpen: (open) => set({ isPrescriptionModalOpen: open }),
  setCartDrawerOpen: (open) => set({ isCartDrawerOpen: open }),
  setSearchOverlayOpen: (open) => set({ isSearchOverlayOpen: open }),
  setQuickViewProduct: (product) => set({ quickViewProduct: product }),
  setPincode: (pincode, city = 'Delivery Area') => set({ activePincode: pincode, cityName: city }),
}));
