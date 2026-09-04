import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // Add item or increment quantity
      addItem: (product, quantity = 1) => {
        const { items } = get();
        const existingIndex = items.findIndex((i) => i.id === product.id);

        if (existingIndex > -1) {
          const currentItem = items[existingIndex];
          const newQuantity = Math.min(
            currentItem.quantity + quantity,
            product.stock !== undefined ? product.stock : 999
          );

          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...currentItem,
            quantity: newQuantity,
          };
          set({ items: updatedItems });
        } else {
          set({
            items: [
              ...items,
              {
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                image_url: product.image_url || '',
                stock: product.stock,
                category: product.category,
                quantity: Math.min(quantity, product.stock !== undefined ? product.stock : 999),
              },
            ],
          });
        }
      },

      // Remove item completely
      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.id !== productId) });
      },

      // Update specific quantity
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const items = get().items.map((item) => {
          if (item.id === productId) {
            const maxStock = item.stock !== undefined ? item.stock : 999;
            return {
              ...item,
              quantity: Math.min(quantity, maxStock),
            };
          }
          return item;
        });

        set({ items });
      },

      // Empty cart
      clearCart: () => set({ items: [] }),

      // Total count of units
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      // Grand total calculation
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + Number(item.price) * item.quantity,
          0
        );
      },
    }),
    {
      name: 'mediswift-cart-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : null)),
    }
  )
);
