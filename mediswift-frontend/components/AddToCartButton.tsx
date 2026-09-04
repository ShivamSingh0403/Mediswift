'use client';

import React, { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { ShoppingBag, Check } from 'lucide-react';

interface MedicineProps {
  id: number;
  name: string;
  price: string | number;
  stock: number;
  category: string;
  image_url?: string;
}

export default function AddToCartButton({ medicine }: { medicine: MedicineProps }) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = () => {
    addItem(medicine, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const isOutOfStock = medicine.stock <= 0;

  return (
    <button
      onClick={handleAdd}
      disabled={isOutOfStock}
      className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
        isOutOfStock
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          : added
          ? 'bg-emerald-600 text-white shadow-xs'
          : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow active:scale-95'
      }`}
    >
      {isOutOfStock ? (
        'Out of Stock'
      ) : added ? (
        <>
          <Check className="w-4 h-4" /> Added to Cart
        </>
      ) : (
        <>
          <ShoppingBag className="w-4 h-4" /> Add to Cart
        </>
      )}
    </button>
  );
}
