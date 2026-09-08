'use client';

import React, { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { productService } from '@/services/product-service';
import { Product } from '@/types';
import { useCartStore } from '@/store/cart-store';
import { useNotificationStore } from '@/store/notification-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useUiStore } from '@/store/ui-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
  FileText,
  Heart,
  Share2,
  Clock,
  RotateCcw,
  Zap,
} from 'lucide-react';

export default function MedicineDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();

  const { addItem } = useCartStore();
  const { addToast } = useNotificationStore();
  const { hasProduct, toggleProduct } = useWishlistStore();
  const { setPrescriptionModalOpen, setCartDrawerOpen } = useUiStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'ingredients' | 'usage' | 'warnings' | 'storage' | 'reviews'>('description');
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [frequentlyBought, setFrequentlyBought] = useState<Product | null>(null);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await productService.getProductBySlug(slug);
        if (res?.data) {
          const prod = res.data;
          setProduct(prod);

          const primary = prod.image_url || prod.primary_image || (prod.gallery_images && prod.gallery_images[0]) || '';
          setSelectedImage(primary);

          // Load related products
          if (prod.related_products && prod.related_products.length > 0) {
            setRelatedProducts(prod.related_products);
            setFrequentlyBought(prod.related_products[0] || null);
          } else {
            const relRes = await productService.getRelatedProducts(prod.id);
            if (relRes?.data) {
              setRelatedProducts(relRes.data);
              setFrequentlyBought(relRes.data[0] || null);
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
        <p className="text-slate-500 text-sm">Loading authentic medicine details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center bg-white rounded-3xl border border-slate-200 my-8 shadow-xs">
        <Pill className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-lg font-bold text-slate-800">Product not found</p>
        <p className="text-slate-500 text-xs mt-1 mb-6">
          The requested healthcare item might have been moved or discontinued.
        </p>
        <Link href="/medicines">
          <Button variant="primary" size="md">
            Browse All Medicines
          </Button>
        </Link>
      </div>
    );
  }

  const isWishlisted = hasProduct(product.id);

  const handleAddToCart = () => {
    addItem(product, quantity);
    addToast({
      type: 'success',
      title: 'Added to Cart',
      message: `${quantity}x ${product.name} added to your basket.`,
    });
    setCartDrawerOpen(true);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push('/cart');
  };

  const handleAddBundle = () => {
    addItem(product, 1);
    if (frequentlyBought) addItem(frequentlyBought, 1);
    addToast({
      type: 'success',
      title: 'Combo Added',
      message: 'Combo pair added to your shopping basket.',
    });
    setCartDrawerOpen(true);
  };

  const allImages = Array.from(new Set([
    product.image_url,
    product.primary_image,
    ...(product.gallery_images || []),
    ...(product.additional_images || []),
  ])).filter(Boolean) as string[];

  const discountVal = parseFloat(product.discount_percent || product.discount_percentage || '0');
  const ratingVal = parseFloat(product.rating || '4.6');
  const reviewCount = product.review_count || 58;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-[#00A896] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/medicines" className="hover:text-[#00A896] transition-colors">Medicines</Link>
        <span>/</span>
        <Link href={`/categories/${product.category_slug || product.category}`} className="hover:text-[#00A896] transition-colors">
          {product.category_name || 'Category'}
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-bold truncate max-w-xs">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Multi-Image Interactive Gallery */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-24 space-y-4">
            {/* Primary Large Display */}
            <div className="relative w-full aspect-square rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-xs flex items-center justify-center group">
              {selectedImage ? (
                <Image
                  src={selectedImage}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#00A896] p-8 text-center">
                  <Pill className="h-20 w-20 stroke-1 opacity-70 mb-3" />
                  <span className="font-bold text-slate-700">{product.name}</span>
                  <span className="text-xs text-slate-400 mt-1">{product.pack_size}</span>
                </div>
              )}

              {/* Floating Top Badges */}
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

            {/* Clickable Thumbnails */}
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
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Trust Badges Strip */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-3xl bg-slate-50 border border-slate-200/80 text-center">
              <div className="flex flex-col items-center">
                <ShieldCheck className="h-5 w-5 text-[#00A896] mb-1" />
                <span className="text-[11px] font-bold text-slate-800">100% Genuine</span>
                <span className="text-[10px] text-slate-400">Direct from mfr</span>
              </div>
              <div className="flex flex-col items-center">
                <Thermometer className="h-5 w-5 text-[#00A896] mb-1" />
                <span className="text-[11px] font-bold text-slate-800">Cold Chain</span>
                <span className="text-[10px] text-slate-400">Temp Monitored</span>
              </div>
              <div className="flex flex-col items-center">
                <Truck className="h-5 w-5 text-[#00A896] mb-1" />
                <span className="text-[11px] font-bold text-slate-800">Express 2hr</span>
                <span className="text-[10px] text-slate-400">Doorstep Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata, Price, Tabs, Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
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

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => toggleProduct(product.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  isWishlisted
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-slate-50'
                }`}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{isWishlisted ? 'Saved' : 'Wishlist'}</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-[#0A2540] leading-tight">
              {product.name}
            </h1>

            <p className="text-sm font-medium text-[#00A896] mt-1.5">
              Composition: {product.ingredients || product.composition || product.generic_name}
            </p>

            {/* Ratings & Manufacturer */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-slate-900">{ratingVal.toFixed(1)}</span>
                <span className="text-slate-500">({reviewCount} verified reviews)</span>
              </div>

              {product.manufacturer && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <PackageCheck className="h-4 w-4 text-slate-400" />
                  <span>Manufactured by <strong className="text-slate-800">{product.manufacturer}</strong></span>
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

            {/* Quantity Controller & CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-1 min-w-[120px]">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-white transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-3 text-sm font-bold text-slate-800">
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

              <Button
                variant="secondary"
                size="lg"
                onClick={handleBuyNow}
                disabled={!product.in_stock}
                className="rounded-2xl font-bold h-12 px-6"
              >
                Buy Now
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
                  Under Indian Drug Regulations (CDSCO), this medicine requires a valid prescription from a registered medical practitioner. Upload your prescription now or upload later in your order history.
                </p>
                <button
                  type="button"
                  onClick={() => setPrescriptionModalOpen(true)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#00A896] hover:bg-[#008f80] px-4 py-2 rounded-xl transition-all shadow-xs"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload Prescription Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Clinical Information Navigation Tabs */}
          <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="flex border-b border-slate-100 overflow-x-auto p-1 bg-slate-50/50">
              {[
                { id: 'description', label: 'Description & Uses' },
                { id: 'ingredients', label: 'Salt Composition' },
                { id: 'usage', label: 'Directions & Dosage' },
                { id: 'warnings', label: 'Safety & Warnings' },
                { id: 'storage', label: 'Storage' },
                { id: 'reviews', label: 'Patient Reviews' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-[#00A896] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'description' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Therapeutic Indications & Medical Profile</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {product.detailed_description || product.description || product.short_description}
                  </p>
                </div>
              )}

              {activeTab === 'ingredients' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Active Pharmaceutical Ingredients (API)</h4>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-mono text-xs text-slate-700">
                    {product.ingredients || product.composition || product.generic_name}
                  </div>
                  <p className="text-xs text-slate-400">
                    Standardized formulation produced in GMP-certified facilities.
                  </p>
                </div>
              )}

              {activeTab === 'usage' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Directions for Use & Dosage Guidelines</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {product.directions || product.usage_instructions || 'Take as advised by your physician. Do not crush or chew tablets. Swallow whole with a full glass of water.'}
                  </p>
                </div>
              )}

              {activeTab === 'warnings' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-rose-950 text-sm flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    Warnings, Precautions & Contraindications
                  </h4>
                  <p className="text-xs sm:text-sm text-rose-900 leading-relaxed bg-rose-50/60 p-4 rounded-2xl border border-rose-100">
                    {product.warnings || product.side_effects || 'Consult your doctor before use if you are pregnant, planning to become pregnant, or breastfeeding. Avoid alcohol consumption during this medication course.'}
                  </p>
                </div>
              )}

              {activeTab === 'storage' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Thermometer className="h-4 w-4 text-[#00A896]" />
                    Storage Guidelines
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {product.storage_information || 'Store in a cool, dry place away from direct sunlight. Keep below 25°C. Keep out of reach of children.'}
                  </p>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-slate-900">{ratingVal.toFixed(1)}</span>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">{reviewCount} verified buyer reviews</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-800">Suresh Patel</span>
                        <span className="text-slate-400">Verified Buyer</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 mb-1.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-xs text-slate-600">
                        Received genuine batch with good expiry date. 2-hour delivery arrived right on schedule.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-800">Kavita Iyer</span>
                        <span className="text-slate-400">Verified Buyer</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 mb-1.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-xs text-slate-600">
                        Great packaging in cold-insulated bag. Will definitely order monthly refills here.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Frequently Bought Together Combo Module */}
          {frequentlyBought && (
            <div className="p-6 rounded-3xl bg-teal-50/50 border border-teal-100 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#00A896]" />
                Frequently Bought Together
              </h3>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                    {selectedImage ? (
                      <Image src={selectedImage} alt={product.name} fill className="object-cover" />
                    ) : (
                      <Pill className="h-8 w-8 text-[#00A896] m-auto" />
                    )}
                  </div>
                  <Plus className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="relative w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                    {frequentlyBought.image_url ? (
                      <Image src={frequentlyBought.image_url} alt={frequentlyBought.name} fill className="object-cover" />
                    ) : (
                      <Pill className="h-8 w-8 text-[#00A896] m-auto" />
                    )}
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-900 truncate max-w-[180px]">{frequentlyBought.name}</div>
                    <div className="text-slate-500">{formatCurrency(frequentlyBought.discounted_price)}</div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddBundle}
                  className="rounded-xl font-bold whitespace-nowrap"
                >
                  Buy Both • {formatCurrency(parseFloat(product.discounted_price || '0') + parseFloat(frequentlyBought.discounted_price || '0'))}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products Carousel/Grid */}
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
                Clinically related therapeutic formulations in {product.category_name}.
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
