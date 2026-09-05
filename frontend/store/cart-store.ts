import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

export interface CartItemState {
  id: string;
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItemState[];
  totalItems: number;
  subtotal: number;
  requiresPrescription: boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const computeTotals = (items: CartItemState[]) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.product.discounted_price || item.product.price) * item.quantity,
    0
  );
  const requiresPrescription = items.some((item) => item.product.prescription_required);

  return { totalItems, subtotal: Math.round(subtotal * 100) / 100, requiresPrescription };
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      subtotal: 0,
      requiresPrescription: false,

      addItem: (product, quantity = 1) => {
        const currentItems = [...get().items];
        const existingIdx = currentItems.findIndex((item) => item.product.id === product.id);

        if (existingIdx > -1) {
          currentItems[existingIdx].quantity += quantity;
        } else {
          currentItems.push({
            id: product.id,
            product,
            quantity,
          });
        }

        const totals = computeTotals(currentItems);
        set({ items: currentItems, ...totals });
      },

      removeItem: (productId) => {
        const currentItems = get().items.filter((item) => item.product.id !== productId);
        const totals = computeTotals(currentItems);
        set({ items: currentItems, ...totals });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const currentItems = get().items.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        );
        const totals = computeTotals(currentItems);
        set({ items: currentItems, ...totals });
      },

      clearCart: () => {
        set({ items: [], totalItems: 0, subtotal: 0, requiresPrescription: false });
      },
    }),
    {
      name: 'mediswift_cart',
    }
  )
);
