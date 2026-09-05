import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistStore {
  productIds: string[];
  doctorIds: string[];
  toggleProduct: (productId: string) => void;
  toggleDoctor: (doctorId: string) => void;
  hasProduct: (productId: string) => boolean;
  hasDoctor: (doctorId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      doctorIds: [],

      toggleProduct: (productId) => {
        const { productIds } = get();
        if (productIds.includes(productId)) {
          set({ productIds: productIds.filter((id) => id !== productId) });
        } else {
          set({ productIds: [...productIds, productId] });
        }
      },

      toggleDoctor: (doctorId) => {
        const { doctorIds } = get();
        if (doctorIds.includes(doctorId)) {
          set({ doctorIds: doctorIds.filter((id) => id !== doctorId) });
        } else {
          set({ doctorIds: [...doctorIds, doctorId] });
        }
      },

      hasProduct: (productId) => get().productIds.includes(productId),
      hasDoctor: (doctorId) => get().doctorIds.includes(doctorId),
    }),
    {
      name: 'mediswift_wishlist',
    }
  )
);
