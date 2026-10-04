import productImagesManifestRaw from './product-images.json';

export type ProductImageResolutionStatus =
  | 'VERIFIED'
  | 'USER_UPLOADED'
  | 'LICENSED'
  | 'DEMO'
  | 'FALLBACK';

export interface ResolvedProductImage {
  src: string;
  fallbackSrc: string;
  alt: string;
  status: ProductImageResolutionStatus;
  isVerified: boolean;
  isDemo: boolean;
  badgeLabel: string | null;
  badgeType: 'verified' | 'review' | 'demo' | null;
}

export interface ProductLike {
  id?: string | number;
  name?: string;
  sku?: string;
  slug?: string;
  image?: string | null;
  image_url?: string | null;
  primary_image?: string | null;
  image_status?: string | null;
  image_alt?: string | null;
  image_alt_text?: string | null;
  is_real_product_photo?: boolean;
  brand_name?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  strength?: string | null;
  pack_size?: string | null;
  dosage_form?: string | null;
}

const manifest = productImagesManifestRaw as Record<
  string,
  { image: string; status: string; name?: string; category?: string }
>;

const GENERIC_FALLBACK = '/products/fallback-generic.webp';
const GENERIC_FALLBACK_SVG = '/products/fallback-generic.svg';

/**
 * Normalizes backend media URLs into valid frontend-loadable URLs.
 */
function normalizeMediaUrl(url: string, sku?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // If already relative to public /products
  if (trimmed.startsWith('/products/')) {
    return trimmed;
  }

  // If local static /media/ product image that has a local SKU counterpart
  if (sku && (trimmed.includes('/product_images/ai_demo/') || trimmed.includes('/products/'))) {
    return `/products/${sku}.webp`;
  }

  // If relative Django media path
  if (trimmed.startsWith('/media/')) {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
    try {
      const parsed = new URL(apiBase);
      return `${parsed.origin}${trimmed}`;
    } catch {
      return `http://127.0.0.1:8000${trimmed}`;
    }
  }

  // Normalize localhost vs 127.0.0.1 if needed
  if (trimmed.startsWith('http://localhost:8000/media/')) {
    return trimmed.replace('http://localhost:8000', 'http://127.0.0.1:8000');
  }

  return trimmed;
}

/**
 * Authoritative Centralized Image Resolution Helper
 * Priority:
 * 1. Verified uploaded / authentic packaging photo
 * 2. Approved project asset / user-uploaded photo
 * 3. Demo visual generated specifically for SKU
 * 4. Generic healthcare fallback
 */
export function resolveProductImage(product?: ProductLike | null): ResolvedProductImage {
  if (!product) {
    return {
      src: GENERIC_FALLBACK,
      fallbackSrc: GENERIC_FALLBACK_SVG,
      alt: 'Healthcare Product Visual',
      status: 'FALLBACK',
      isVerified: false,
      isDemo: true,
      badgeLabel: 'DEMO VISUAL',
      badgeType: 'demo',
    };
  }

  const sku = (product.sku || '').trim().toUpperCase();
  const rawStatus = (product.image_status || '').trim().toUpperCase();
  const isReal = product.is_real_product_photo === true || rawStatus === 'VERIFIED';

  // Check explicit image fields on product
  const candidateUrl =
    product.image ||
    product.image_url ||
    product.primary_image ||
    '';

  const manifestEntry = sku ? manifest[sku] : undefined;

  // Compute Alt text
  const alt =
    product.image_alt ||
    product.image_alt_text ||
    (product.name
      ? `${product.name} ${product.strength || ''} ${product.pack_size || ''}`.trim()
      : 'Healthcare product visual');

  // Priority 1: Verified authentic photograph
  if (isReal && candidateUrl) {
    const normalized = normalizeMediaUrl(candidateUrl, sku);
    if (normalized) {
      return {
        src: normalized,
        fallbackSrc: sku ? `/products/${sku}.webp` : GENERIC_FALLBACK,
        alt,
        status: 'VERIFIED',
        isVerified: true,
        isDemo: false,
        badgeLabel: 'VERIFIED',
        badgeType: 'verified',
      };
    }
  }

  // Priority 2: User-uploaded / Licensed / Under review asset
  if (
    (rawStatus === 'USER_UPLOADED' ||
      rawStatus === 'LICENSED' ||
      rawStatus === 'PENDING_REVIEW' ||
      rawStatus === 'DOWNLOADED') &&
    candidateUrl
  ) {
    const normalized = normalizeMediaUrl(candidateUrl, sku);
    if (normalized) {
      return {
        src: normalized,
        fallbackSrc: sku ? `/products/${sku}.webp` : GENERIC_FALLBACK,
        alt,
        status: rawStatus === 'LICENSED' ? 'LICENSED' : 'USER_UPLOADED',
        isVerified: false,
        isDemo: false,
        badgeLabel: 'UNDER REVIEW',
        badgeType: 'review',
      };
    }
  }

  // Priority 3: Demo image generated specifically for this SKU
  if (sku) {
    // If manifest has SKU or local file exists
    const demoPath = manifestEntry?.image || `/products/${sku}.webp`;
    return {
      src: demoPath,
      fallbackSrc: GENERIC_FALLBACK,
      alt: `${alt} (Demo Visual)`,
      status: 'DEMO',
      isVerified: false,
      isDemo: true,
      badgeLabel: 'DEMO VISUAL',
      badgeType: 'demo',
    };
  }

  // If candidateUrl is provided as a demo or general url
  if (candidateUrl) {
    const normalized = normalizeMediaUrl(candidateUrl, sku);
    if (normalized) {
      return {
        src: normalized,
        fallbackSrc: GENERIC_FALLBACK,
        alt,
        status: 'DEMO',
        isVerified: false,
        isDemo: true,
        badgeLabel: 'DEMO VISUAL',
        badgeType: 'demo',
      };
    }
  }

  // Priority 4: Generic healthcare fallback
  return {
    src: GENERIC_FALLBACK,
    fallbackSrc: GENERIC_FALLBACK_SVG,
    alt,
    status: 'FALLBACK',
    isVerified: false,
    isDemo: true,
    badgeLabel: 'DEMO VISUAL',
    badgeType: 'demo',
  };
}
