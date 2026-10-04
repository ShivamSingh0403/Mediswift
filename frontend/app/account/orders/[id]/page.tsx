'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { orderService } from '@/services/order-service';
import { Order, OrderStatus } from '@/types';
import { useNotificationStore } from '@/store/notification-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ProductImage } from '@/components/ProductImage';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  ArrowLeft,
  Printer,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  Tag,
  FileText,
  Phone,
  Package,
} from 'lucide-react';

const TIMELINE_STAGES: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'PLACED', label: 'Order Placed', desc: 'Received in dispensary' },
  { key: 'CONFIRMED', label: 'Payment Confirmed', desc: 'Prescription & payment validated' },
  { key: 'PROCESSING', label: 'Dispensing & Batch Check', desc: 'Pharmacist verification' },
  { key: 'PACKED', label: 'Packed (Tamper Proof)', desc: 'Cold-chain seal secured' },
  { key: 'SHIPPED', label: 'Handed to Courier', desc: 'In express logistics transit' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider en route to doorstep' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Handed to verified customer' },
];

export default function AccountOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);

  const { addToast } = useNotificationStore();

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await orderService.getOrderById(orderId);
        if (res?.data) {
          setOrder(res.data);
        }
      } catch {
        // Silently handled
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  const handleReorder = async () => {
    if (!order) return;
    setIsReordering(true);
    try {
      const res = await orderService.reorder(order.id);
      if (res?.data) {
        addToast({
          type: 'success',
          title: 'Medicines Added to Cart',
          message: res.message || 'Items from this order have been placed back into your cart.',
        });
        router.push('/cart');
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Reorder Issue',
        message: 'Could not reorder all items. Please check inventory in our catalog.',
      });
    } finally {
      setIsReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-4 border-[#00A896]/20 border-t-[#00A896] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading order tracking, timeline, and invoice...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
        <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-base">Order Not Found</h3>
        <p className="text-xs text-slate-400 mt-1 mb-6">We could not find an active order matching this reference.</p>
        <Link href="/account/orders">
          <Button variant="primary" size="md">Back to My Orders</Button>
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED';
  const stageKeys = TIMELINE_STAGES.map((s) => s.key);
  const currentStageIndex = stageKeys.indexOf(order.status);

  // Delivery Address: Use snapshot if available, or current shipping_address
  const address = order.shipping_address_snapshot || order.shipping_address;
  const paymentRecord = order.payments?.[0];
  const paymentStatus = order.payment_status || paymentRecord?.status || (order.status === 'CONFIRMED' ? 'PAID' : 'PENDING');
  const isPaid = paymentStatus === 'PAID';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Top Action Bar (hidden in print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#00A896] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Orders</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReorder}
            isLoading={isReordering}
            className="rounded-xl text-xs font-semibold"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reorder Items
          </Button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 bg-white px-3.5 py-1.5 rounded-xl shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Print Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* Invoice / Order Header Card */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-[#0A2540]">
                Order {order.order_number}
              </h1>
              <Badge variant={isCancelled ? 'danger' : order.status === 'DELIVERED' ? 'success' : 'primary'}>
                {order.status_display || order.status}
              </Badge>
              <Badge variant={isPaid ? 'success' : 'warning'}>
                {isPaid ? 'PAID' : 'PAYMENT PENDING'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Placed on {formatDate(order.created_at)} • Dispatched by {order.courier_name}
            </p>
          </div>

          <div className="text-left md:text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Total Order Amount (INR)
            </span>
            <span className="text-2xl font-black text-[#00A896]">
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>

        {/* Courier & Tracking Banner */}
        {order.tracking_number && (
          <div className="mt-6 p-4 rounded-2xl bg-teal-50/60 border border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-[#00A896] shrink-0" />
              <div>
                <span className="font-bold text-[#0A2540] block">
                  Express Courier Tracking
                </span>
                <span className="text-slate-600 font-mono text-[11px]">
                  AWB: {order.tracking_number} ({order.courier_name})
                </span>
              </div>
            </div>
            {order.courier_tracking_url && (
              <a
                href={order.courier_tracking_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#00A896] hover:underline"
              >
                Track on Fleet Network →
              </a>
            )}
          </div>
        )}

        {/* Delivery Timeline Checkpoints */}
        <div className="mt-8">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
            Live Delivery Timeline Checkpoints
          </h2>

          {isCancelled ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>This order has been cancelled. If any payment was captured, refund is initiated automatically.</span>
            </div>
          ) : (
            <div className="relative">
              {/* Stepper Grid for Desktop & Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {TIMELINE_STAGES.map((stage, idx) => {
                  const isDone = currentStageIndex >= idx;
                  const isCurrent = currentStageIndex === idx;

                  return (
                    <div key={stage.key} className="flex md:flex-col items-center md:items-center gap-3 md:gap-2">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                          isDone
                            ? 'bg-[#00A896] text-white shadow-xs'
                            : isCurrent
                            ? 'bg-[#0A2540] text-white ring-4 ring-slate-100'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                      </div>

                      <div className="min-w-0 md:text-center">
                        <span className={`text-xs font-bold block ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                          {stage.label}
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:block">
                          {stage.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: Items + Address & Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Ordered Medicines List (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs">
            <h3 className="text-sm font-black text-[#0A2540] uppercase tracking-wider mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Itemized Medications ({order.items?.length || 0})</span>
              <span className="text-[10px] font-normal text-slate-400">Fixed purchase price</span>
            </h3>

            <div className="divide-y divide-slate-100">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-14 h-14 rounded-2xl bg-white border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                      <ProductImage
                        product={{
                          name: item.product_name,
                          image_url: item.product_image,
                          primary_image: item.product_image,
                          dosage_form: 'MEDICINE',
                          category_name: 'Medication',
                        }}
                        className="w-full h-full"
                        sizes="56px"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block truncate">
                        {item.product_name}
                      </span>
                      <span className="text-slate-400 text-[11px] block mt-0.5">
                        Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                      </span>
                      {item.prescription_required && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-1">
                          <FileText className="h-2.5 w-2.5" /> Rx Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 block text-xs">
                      {formatCurrency(item.total_price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {order.delivery_notes && (
              <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-bold text-slate-700 block mb-0.5">Delivery Notes:</span>
                <p className="text-slate-500 text-[11px]">{order.delivery_notes}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Address, Payment & Financial Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Shipping Address Card */}
          <Card className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#00A896]" />
              <span>Delivery Destination</span>
            </h3>

            {address ? (
              <div className="text-xs space-y-1 text-slate-600">
                <div className="font-bold text-slate-900 text-sm">{address.full_name}</div>
                <div className="flex items-center gap-1.5 text-slate-500 pt-0.5">
                  <Phone className="h-3 w-3 text-slate-400" />
                  <span>{address.phone}</span>
                </div>
                <div className="pt-1 leading-relaxed">
                  {address.address_line1}
                  {address.address_line2 ? `, ${address.address_line2}` : ''}
                </div>
                {address.landmark && (
                  <div className="text-slate-400 text-[11px]">Landmark: {address.landmark}</div>
                )}
                <div className="font-medium text-slate-800">
                  {address.city}, {address.state} - {address.postal_code}
                </div>
                <div className="pt-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {address.address_type || 'HOME'}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Address snapshot attached to record.</p>
            )}
          </Card>

          {/* Payment & Security Card */}
          <Card className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#00A896]" />
              <span>Payment & Security</span>
            </h3>

            <div className="text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Method</span>
                <span className="font-bold text-slate-800">
                  {paymentRecord?.provider_display || order.payment_method || 'Online Payment'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment Status</span>
                <Badge variant={isPaid ? 'success' : 'warning'}>
                  {paymentStatus}
                </Badge>
              </div>

              {paymentRecord?.internal_transaction_id && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Transaction ID</span>
                  <span className="font-mono text-[10px] text-slate-600">
                    {paymentRecord.internal_transaction_id}
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center gap-2 text-[10px] text-[#00A896]">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>100% Genuine Pharmacy Guarantee Verified</span>
              </div>
            </div>
          </Card>

          {/* Price Details Card */}
          <Card className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
              Tax Invoice Breakdown
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>

              {parseFloat(order.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Coupon Discount ({order.coupon_code || 'APPLIED'})
                  </span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>2-Hour Express Delivery</span>
                <span>
                  {parseFloat(order.delivery_fee) === 0 ? (
                    <strong className="text-emerald-600">FREE</strong>
                  ) : (
                    formatCurrency(order.delivery_fee)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Packaging & Platform Fee</span>
                <span>{formatCurrency(order.platform_fee)}</span>
              </div>

              {order.tax_amount && parseFloat(order.tax_amount) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Applicable GST / Tax</span>
                  <span>{formatCurrency(order.tax_amount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline font-black text-sm text-[#0A2540]">
                <span>Total Amount</span>
                <span className="text-xl text-[#00A896]">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
