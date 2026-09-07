'use client';

import React, { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { productService } from '@/services/product-service';
import { Product } from '@/types';
import { useCartStore } from '@/store/cart-store';
import { useNotificationStore } from '@/store/notification-store';
import { useUiStore } from '@/store/ui-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/product-card';
import { formatCurrency } from '@/lib/utils';
import {
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  UploadCloud,
  AlertCircle,
  Star,
  Pill,
  Sparkles,
  TrendingUp,
  Info,
  CheckCircle2,
  PackageCheck,
  Thermometer,
  FileText
} from 'lucide-react';

export default function MedicineDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { addItem } = useCartStore();
  const { addToast } = useNotificationStore();
  const { setPrescriptionModalOpen } = useUiStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await productService.getProductBySlug(slug);
        if (res?.data) {
          const prod = res.data;
          setProduct(prod);

          // Select primary image
          const primary = prod.image_url || prod.primary_image || (prod.gallery_images && prod.gallery_images[0]) || '';
          setSelectedImage(primary);

          // Load related products
          if (prod.related_products && prod.related_products.length > 0) {
            setRelatedProducts(prod.related_products);
          } else {
            const relRes = await productService.getRelatedProducts(prod.id);
            if (relRes?.data) {
              setRelatedProducts(relRes.data);
            }
          }
        }
      } catch {
        // Error handling
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-4 border-[#00A896]/20 border-t-[#00A896] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading medicine details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center bg-white rounded-3xl border border-slate-200 my-8 shadow-xs">
        <p className="text-lg font-bold text-slate-800">Product not found</p>
        <p className="text-slate-500 text-xs mt-1 mb-6">The product you are looking for might have been moved or discontinued.</p>
        <Link href="/medicines">
          <Button variant="primary" size="md">
            Browse All Medicines
          </Button>
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    addToast({
      type: 'success',
      title: 'Added to Cart',
      message: `${quantity}x ${product.name} added to your cart.`,
    });
  };

  const allImages = Array.from(new Set([
    product.image_url,
    product.primary_image,
    ...(product.gallery_images || []),
    ...(product.additional_images || [])
  ])).filter(Boolean) as string[];

  const discountVal = parseFloat(product.discount_percent || product.discount_percentage || '0');
  const ratingVal = parseFloat(product.rating || '4.6');
  const reviewCount = product.review_count || 58;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-[#00A896]">Home</Link>
        <span>/</span>
        <Link href="/medicines" className="hover:text-[#00A896]">Medicines</Link>
        <span>/</span>
        <Link href={`/categories/${product.category_slug || product.category}`} className="hover:text-[#00A896]">
          {product.category_name || 'Category'}
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate max-w-xs">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Multi-Image Interactive Gallery */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4">
            {/* Primary Large Display */}
            <div className="relative w-full aspect-square rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-xs flex items-center justify-center">
              {selectedImage ? (
                <Image
                  src={selectedImage}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#00A896] p-8 text-center">
                  <Pill className="h-20 w-20 stroke-1 opacity-70 mb-3" />
                  <span className="font-bold text-slate-700">{product.name}</span>
                  <span className="text-xs text-slate-400 mt-1">{product.pack_size}</span>
                </div>
              )}

              {/* Floating Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {product.prescription_required ? (
                  <Badge variant="rx" className="shadow-xs font-bold text-xs">
                    Rx Prescription Required
                  </Badge>
                ) : (
                  <Badge variant="success" className="shadow-xs font-bold text-xs">
                    Over The Counter (OTC)
                  </Badge>
                )}
                {product.bestseller && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-amber-500 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                    <Sparkles className="h-3 w-3" /> Bestseller
                  </span>
                )}
              </div>

              {discountVal > 0 && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="text-xs font-black text-emerald-800 bg-emerald-100/95 backdrop-blur-xs px-3 py-1 rounded-full shadow-xs">
                    {Math.round(discountVal)}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails Row */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImage === img
                        ? 'border-[#00A896] ring-2 ring-[#00A896]/30 scale-105 shadow-xs'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} angle ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Trust Highlights */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <div className="flex flex-col items-center">
                <ShieldCheck className="h-5 w-5 text-[#00A896] mb-1" />
                <span className="text-[11px] font-bold text-slate-800">100% Genuine</span>
                <span className="text-[10px] text-slate-400">Direct from mfr</span>
              </div>
              <div className="flex flex-col items-center">
                <Thermometer className="h-5 w-5 text-[#00A896] mb-1" />
                <span className="text-[11px] font-bold text-slate-800">Cold Chain</span>
                <span className="text-[10px] text-slate-400">Temp monitored</span>
              </div>
              <div className="flex flex-col items-center">
                <Truck className="h-5 w-5 text-[#00A896] mb-1" />
                <span className="text-[11px] font-bold text-slate-800">Express 2hr</span>
                <span className="text-[10px] text-slate-400">Doorstep delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Product Metadata, Pricing & Tabs */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold text-[#00A896] uppercase tracking-wider">
                {product.brand_name || product.category_name}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">
                {product.dosage_form} {product.strength ? `(${product.strength})` : ''}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">{product.pack_size}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540] leading-tight">
              {product.name}
            </h1>

            <p className="text-sm font-medium text-[#00A896] mt-1.5">
              Composition: {product.ingredients || product.composition || product.generic_name}
            </p>

            {/* Ratings & Manufacturer */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-slate-900">{ratingVal.toFixed(1)}</span>
                <span className="text-slate-500">({reviewCount} verified reviews)</span>
              </div>

              {product.manufacturer && (
                <div className="flex items-center gap-1 text-slate-500">
                  <PackageCheck className="h-3.5 w-3.5 text-slate-400" />
                  <span>Marketed by <strong className="text-slate-700">{product.manufacturer}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Add to Cart Panel */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-[#0A2540]">
                    {formatCurrency(product.discounted_price)}
                  </span>
                  {discountVal > 0 && (
                    <>
                      <span className="text-base text-slate-400 line-through">
                        {formatCurrency(product.price || product.price_inr)}
                      </span>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        Save {Math.round(discountVal)}%
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">MRP inclusive of all taxes</p>
              </div>

              {/* Stock status indicator */}
              <div>
                {product.in_stock ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    In Stock ({product.stock_quantity} available)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Quantity Controller & Add to Cart */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-white transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 text-sm font-bold text-slate-800 min-w-[32px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-white transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                disabled={!product.in_stock}
                className="flex-1 rounded-2xl font-bold shadow-md shadow-[#00A896]/20 h-12"
              >
                Add to Cart • {formatCurrency(parseFloat(product.discounted_price || '0') * quantity)}
              </Button>
            </div>
          </div>

          {/* Rx Upload Alert Banner */}
          {product.prescription_required && (
            <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200 flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-amber-950 text-sm">
                  Doctor&apos;s Prescription Required
                </div>
                <p className="text-amber-800 mt-1 leading-relaxed">
                  As per government drug regulations, this medicine requires a valid prescription issued by a registered medical practitioner.
                </p>
                <button
                  type="button"
                  onClick={() => setPrescriptionModalOpen(true)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#00A896] hover:bg-[#008f80] px-3.5 py-1.5 rounded-xl transition-all shadow-xs"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Upload Prescription Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Structured Medical Information Sections */}
          <div className="space-y-4">
            {/* Description & Uses */}
            <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-xs">
              <h3 className="font-bold text-[#0A2540] text-sm sm:text-base mb-2.5 flex items-center gap-2">
                <Info className="h-4 w-4 text-[#00A896]" />
                Description & Therapeutic Uses
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.detailed_description || product.description || product.short_description}
              </p>
            </div>

            {/* Active Ingredients / Salt Composition */}
            {(product.ingredients || product.composition) && (
              <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-xs">
                <h3 className="font-bold text-[#0A2540] text-sm sm:text-base mb-2.5 flex items-center gap-2">
                  <Pill className="h-4 w-4 text-[#00A896]" />
                  Active Ingredients & Salt Composition
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-mono bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {product.ingredients || product.composition}
                </p>
              </div>
            )}

            {/* Directions & Dosage */}
            {(product.directions || product.usage_instructions) && (
              <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-xs">
                <h3 className="font-bold text-[#0A2540] text-sm sm:text-base mb-2.5 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#00A896]" />
                  Directions for Use & Dosage
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {product.directions || product.usage_instructions}
                </p>
              </div>
            )}

            {/* Warnings & Safety Advice */}
            {(product.warnings || product.side_effects) && (
              <div className="rounded-3xl bg-rose-50/50 p-6 border border-rose-100 shadow-xs">
                <h3 className="font-bold text-rose-950 text-sm sm:text-base mb-2.5 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  Warnings, Precautions & Safety Advice
                </h3>
                <p className="text-xs sm:text-sm text-rose-900 leading-relaxed">
                  {product.warnings || product.side_effects}
                </p>
              </div>
            )}

            {/* Storage Information */}
            {product.storage_information && (
              <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-xs">
                <h3 className="font-bold text-[#0A2540] text-sm sm:text-base mb-2.5 flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-[#00A896]" />
                  Storage Information
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {product.storage_information}
                </p>
              </div>
            )}

            {/* Product Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {product.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Recommendation Carousel/Grid */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-[#00A896] uppercase tracking-wider">
                Recommended For You
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0A2540] tracking-tight mt-1">
                Related Medicines & Alternatives
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Explore clinically related therapeutic formulations in {product.category_name}.
              </p>
            </div>
            <Link href={`/categories/${product.category_slug || product.category}`}>
              <Button variant="outline" size="sm" className="rounded-xl">
                View Category
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
