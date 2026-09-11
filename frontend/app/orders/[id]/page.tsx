'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { orderService } from '@/services/order-service';
import { Order, OrderStatus } from '@/types';
import { useCartStore } from '@/store/cart-store';
import { useNotificationStore } from '@/store/notification-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  MapPin,
  ArrowLeft,
  Printer,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Tag,
  FileText,
  Calendar,
  Phone,
} from 'lucide-react';

const TIMELINE_STAGES: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'PLACED', label: 'Order Placed', desc: 'Received in dispensary' },
  { key: 'CONFIRMED', label: 'Confirmed', desc: 'Prescription & payment confirmed' },
  { key: 'PROCESSING', label: 'Dispensing & Batch Check', desc: 'Pharmacist verification' },
  { key: 'PACKED', label: 'Packed (Tamper Proof)', desc: 'Cold-chain seal secured' },
  { key: 'SHIPPED', label: 'Handed to Courier', desc: 'In express logistics transit' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider en route to doorstep' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Handed to verified customer' },
];

export default function OrderTrackingDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
        // Handle error
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
        <p className="text-slate-500 text-sm">Loading order tracking, courier timeline & invoice...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
        <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-base">Order Not Found</h3>
        <p className="text-xs text-slate-400 mt-1 mb-6">We couldn&apos;t find an active order matching this reference.</p>
        <Link href="/orders">
          <Button variant="primary" size="md">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED';
  const stageKeys = TIMELINE_STAGES.map((s) => s.key);
  const currentStageIndex = stageKeys.indexOf(order.status);

  // Use snapshot if available, or current shipping_address
  const address = order.shipping_address_snapshot || order.shipping_address;
  const paymentRecord = order.payments?.[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      {/* Top Action Bar (hidden in print) */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link
          href="/orders"
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
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reorder Medicines
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-[#0A2540]">
                Order #{order.order_number}
              </h1>
              <Badge variant={isCancelled ? 'danger' : order.status === 'DELIVERED' ? 'success' : 'primary'}>
                {order.status_display || order.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Placed on {formatDate(order.created_at)} • Tracking ID: <span className="font-mono font-bold text-slate-800">{order.tracking_number || 'N/A'}</span>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">Total Amount Paid</span>
            <span className="text-2xl font-black text-[#00A896]">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>

        {/* Courier Details Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs text-slate-600">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Carrier Fleet</span>
            <span className="font-bold text-slate-800">{order.courier_name || 'MediSwift Express Logistics'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Delivery</span>
            <span className="font-bold text-slate-800">
              {order.estimated_delivery ? formatDate(order.estimated_delivery) : 'Within 24-48 Hours'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Live Courier Tracking</span>
            {order.courier_tracking_url ? (
              <a
                href={order.courier_tracking_url}
                target="_blank"
                rel="noreferrer"
                className="text-[#00A896] font-bold hover:underline inline-flex items-center gap-1"
              >
                Track Live GPS <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="text-slate-500">Active Express Dispatch</span>
            )}
          </div>
        </div>
      </div>

      {/* 8-Stage Delivery Tracking Progress Timeline */}
      <Card className="p-6 sm:p-8 mb-8 rounded-3xl border border-slate-200 bg-white shadow-xs">
        <h3 className="font-bold text-[#0A2540] text-sm mb-6 flex items-center gap-2">
          <Truck className="h-4 w-4 text-[#00A896]" />
          <span>Real-Time Courier & Fulfillment Progress</span>
        </h3>

        {isCancelled ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>This order was cancelled. Any deductions will be refunded to your original payment method.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 relative">
            {TIMELINE_STAGES.map((stage, idx) => {
              const isPassed = currentStageIndex >= idx;
              const isCurrent = currentStageIndex === idx;

              // Check if backend provided timeline event
              const checkpoint = order.delivery_timeline?.find((c) => c.status === stage.key);
              const eventCompleted = checkpoint ? checkpoint.completed : isPassed;

              return (
                <div key={stage.key} className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                      eventCompleted
                        ? 'bg-[#00A896] text-white shadow-md shadow-[#00A896]/20'
                        : isCurrent
                        ? 'bg-[#0A2540] text-white ring-4 ring-slate-100'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {eventCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <span className={`text-xs block ${eventCompleted ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                      {stage.label}
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                      {stage.desc}
                    </span>
                    {checkpoint?.timestamp && (
                      <span className="text-[9px] text-[#00A896] font-mono block mt-0.5">
                        {new Date(checkpoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Items & Shipping Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Package Items */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
            <h3 className="font-bold text-[#0A2540] text-sm border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Items in this Shipment</span>
              <span className="text-xs text-slate-400 font-normal">{order.items?.length || 0} product(s)</span>
            </h3>

            <div className="divide-y divide-slate-100">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100/60 flex items-center justify-center shrink-0">
                      <span className="text-base">💊</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">{item.product_name}</span>
                      <span className="text-slate-400 text-[11px]">
                        Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                      </span>
                      {item.prescription_required && (
                        <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 mt-0.5">
                          Rx Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">{formatCurrency(item.total_price)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#00A896]" />
                <span>Cold-Chain Insulated Medical Packaging</span>
              </span>
              <span>Batch & Expiry Inspected</span>
            </div>
          </Card>
        </div>

        {/* Right: Address & Payment Receipts */}
        <div className="lg:col-span-5 space-y-4">
          {/* Frozen Address Snapshot */}
          <Card className="p-6 rounded-3xl border border-slate-200 bg-white space-y-3 shadow-xs">
            <h3 className="font-bold text-[#0A2540] text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#00A896]" />
              <span>Delivery Address (Frozen Snapshot)</span>
            </h3>
            {address && (
              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{address.full_name}</div>
                <div>{address.address_line1 || (address as any).address_line}</div>
                {address.address_line2 && <div>{address.address_line2}</div>}
                {address.landmark && <div className="text-[11px] text-slate-400">Landmark: {address.landmark}</div>}
                <div>
                  {address.city}, {address.state} - <span className="font-mono font-bold">{address.postal_code || (address as any).pincode}</span>
                </div>
                <div className="text-slate-500 pt-1 font-mono flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {address.phone}
                </div>
              </div>
            )}
          </Card>

          {/* Payment Details & Financial Breakdown */}
          <Card className="p-6 rounded-3xl border border-slate-200 bg-white space-y-3 text-xs shadow-xs">
            <h3 className="font-bold text-[#0A2540] text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#00A896]" />
              <span>Financial Receipt & Payment Details</span>
            </h3>

            {/* Payment record info */}
            {paymentRecord && (
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100/70 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Payment Gateway:</span>
                  <span className="font-bold text-slate-900">{paymentRecord.provider_display || paymentRecord.provider}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Payment Status:</span>
                  <Badge variant={paymentRecord.status === 'PAID' || paymentRecord.status === 'SUCCESS' ? 'success' : 'warning'}>
                    {paymentRecord.status_display || paymentRecord.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Internal Ref:</span>
                  <span className="font-mono text-slate-800">{paymentRecord.internal_transaction_id}</span>
                </div>
                {paymentRecord.provider_transaction_id && (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Gateway Txn:</span>
                    <span className="font-mono text-slate-800">{paymentRecord.provider_transaction_id}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between text-slate-500 pt-1">
              <span>Items Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>

            {parseFloat(order.discount_amount || '0') > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Coupon Discount {order.coupon_code ? `(${order.coupon_code})` : ''}
                </span>
                <span>-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-500">
              <span>Delivery Fee</span>
              <span>
                {parseFloat(order.delivery_fee) === 0 ? (
                  <span className="font-bold text-emerald-600">FREE</span>
                ) : (
                  formatCurrency(order.delivery_fee)
                )}
              </span>
            </div>

            {order.platform_fee && (
              <div className="flex justify-between text-slate-500">
                <span>Healthcare Platform Fee</span>
                <span>{formatCurrency(order.platform_fee)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-500">
              <span>Taxes & GST</span>
              <span className="text-emerald-600 font-semibold">Included</span>
            </div>

            <div className="flex justify-between font-black text-base text-[#0A2540] pt-3 border-t border-slate-100">
              <span>Total Amount Paid</span>
              <span className="text-[#00A896]">{formatCurrency(order.total_amount)}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
