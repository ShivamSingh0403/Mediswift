import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

interface WishlistStore {
  productIds: string[];
  products: Product[];
  doctorIds: string[];
  addProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  toggleProduct: (product: Product | string) => void;
  toggleDoctor: (doctorId: string) => void;
  hasProduct: (productId: string) => boolean;
  hasDoctor: (doctorId: string) => boolean;
  moveToCart: (productId: string, addItemToCart: (product: Product) => void) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      products: [],
      doctorIds: [],

      addProduct: (product) => {
        const { productIds, products } = get();
        if (!productIds.includes(product.id)) {
          set({
            productIds: [...productIds, product.id],
            products: [...products, product],
          });
        }
      },

      removeProduct: (productId) => {
        const { productIds, products } = get();
        set({
          productIds: productIds.filter((id) => id !== productId),
          products: products.filter((p) => p.id !== productId),
        });
      },

      toggleProduct: (item) => {
        const productId = typeof item === 'string' ? item : item.id;
        const { productIds, products } = get();
        if (productIds.includes(productId)) {
          set({
            productIds: productIds.filter((id) => id !== productId),
            products: products.filter((p) => p.id !== productId),
          });
        } else {
          set({
            productIds: [...productIds, productId],
            products: typeof item === 'object' ? [...products, item] : products,
          });
        }
      },

      moveToCart: (productId, addItemToCart) => {
        const { products, removeProduct } = get();
        const product = products.find((p) => p.id === productId);
        if (product) {
          addItemToCart(product);
          removeProduct(productId);
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
      clearWishlist: () => set({ productIds: [], products: [], doctorIds: [] }),
    }),
    {
      name: 'mediswift_wishlist',
    }
  )
);
