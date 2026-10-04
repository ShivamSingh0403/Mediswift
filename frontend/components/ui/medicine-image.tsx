'use client';

import React from 'react';
import { ProductImage, ProductImageProps } from '@/components/ProductImage';
import { resolveProductImage } from '@/lib/image-resolver';
import { Product, ProductImageStatus } from '@/types';

export interface MedicineImageProps extends Omit<ProductImageProps, 'product'> {
  product: Partial<Product> & {
    id?: string;
    name?: string;
    sku?: string;
    slug?: string;
    brand_name?: string;
    category_name?: string;
    category_slug?: string;
    dosage_form?: string;
    strength?: string;
    pack_size?: string;
    image_url?: string;
    primary_image?: string;
    image_status?: ProductImageStatus | string;
    image_alt?: string;
    image_alt_text?: string;
    is_real_product_photo?: boolean;
    image_source?: string;
    source_url?: string;
    image_license?: string;
    verified_by?: string;
    verified_at?: string | null;
    is_demo_data?: boolean;
  };
}

export function MedicalCrossIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M8.5 3a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v4h4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-4v4a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5v-4h-4A1.5 1.5 0 0 1 3 14v-4A1.5 1.5 0 0 1 4.5 8.5h4V3z" />
    </svg>
  );
}

export function MedicineImage(props: MedicineImageProps) {
  return <ProductImage {...props} />;
}

export { ProductImage, resolveProductImage };
export default MedicineImage;
