/**
 * MediSwift Centralized Product Image & Asset Mapper
 * Delegates to centralized image-resolver to ensure single source of truth.
 */
import {
  resolveProductImage as canonicalResolveProductImage,
  ProductLike,
  ResolvedProductImage,
} from './image-resolver';

export { canonicalResolveProductImage as resolveProductImage };

export interface ProductImageMeta {
  imageUrl: string | null;
  additionalImages: string[];
  altText: string;
  source: 'verified-asset' | 'category-representative' | 'pharmaceutical-card' | 'demo-asset';
  hasVerifiedPhoto: boolean;
  dosageFormBadge?: string;
  categoryBanner?: string;
}

export function resolveProductImageMeta(product: ProductLike): ProductImageMeta {
  const resolved: ResolvedProductImage = canonicalResolveProductImage(product);
  return {
    imageUrl: resolved.src,
    additionalImages: [],
    altText: resolved.alt,
    source: resolved.isVerified
      ? 'verified-asset'
      : resolved.isDemo
      ? 'demo-asset'
      : 'pharmaceutical-card',
    hasVerifiedPhoto: resolved.isVerified,
    dosageFormBadge: product.dosage_form || 'HEALTHCARE',
  };
}
