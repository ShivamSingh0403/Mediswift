import { create } from 'zustand';

interface UiStore {
  isMobileMenuOpen: boolean;
  isPrescriptionModalOpen: boolean;
  isCartDrawerOpen: boolean;
  activePincode: string;
  cityName: string;
  setMobileMenuOpen: (open: boolean) => void;
  setPrescriptionModalOpen: (open: boolean) => void;
  setCartDrawerOpen: (open: boolean) => void;
  setPincode: (pincode: string, city?: string) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  isMobileMenuOpen: false,
  isPrescriptionModalOpen: false,
  isCartDrawerOpen: false,
  activePincode: '380054',
  cityName: 'Ahmedabad',

  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  setPrescriptionModalOpen: (open) => set({ isPrescriptionModalOpen: open }),
  setCartDrawerOpen: (open) => set({ isCartDrawerOpen: open }),
  setPincode: (pincode, city = 'Delivery Area') => set({ activePincode: pincode, cityName: city }),
}));
