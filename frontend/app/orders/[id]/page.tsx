'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { orderService } from '@/services/order-service';
import { Order } from '@/types';
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
} from 'lucide-react';

export default function OrderTrackingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await orderService.getOrderById(orderId);
        if (res?.data) setOrder(res.data);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-4 border-[#00A896]/20 border-t-[#00A896] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading order tracking & invoice...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
        <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-base">Order Not Found</h3>
        <p className="text-xs text-slate-400 mt-1 mb-6">We couldn&apos;t find an active order with the specified ID.</p>
        <Link href="/orders">
          <Button variant="primary" size="md">Back to Order History</Button>
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED';

  const orderStages = [
    { key: 'PLACED', label: 'Order Placed', desc: 'Received in system' },
    { key: 'CONFIRMED', label: 'Confirmed', desc: 'Payment authorized' },
    { key: 'PROCESSING', label: 'Packed by Pharmacist', desc: 'Batch & expiry verified' },
    { key: 'DISPATCHED', label: 'Dispatched', desc: 'Left micro-warehouse' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider on the way' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Handed over' },
  ];

  const stageKeys = orderStages.map((s) => s.key);
  const currentStageIndex = stageKeys.indexOf(order.status);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      {/* Back button */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#00A896] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Order History</span>
        </Link>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-3 py-1.5 rounded-xl shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print / Save Invoice</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-[#0A2540]">
                Order {order.order_number}
              </h1>
              <Badge variant={isCancelled ? 'danger' : 'success'}>
                {order.status_display}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Placed on {formatDate(order.created_at)} • Tracking Number: <span className="font-mono font-bold text-slate-800">{order.tracking_number}</span>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">Total Amount</span>
            <span className="text-2xl font-black text-[#0A2540]">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Visual Tracking Progress Timeline */}
      <Card className="p-6 sm:p-8 mb-8 rounded-3xl border border-slate-200 bg-white shadow-xs">
        <h3 className="font-bold text-[#0A2540] text-sm mb-6 flex items-center gap-2">
          <Truck className="h-4 w-4 text-[#00A896]" />
          <span>Live Courier & Verification Timeline</span>
        </h3>

        {isCancelled ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>This order was cancelled. Any deductions will be refunded within 3-5 business days.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 relative">
            {orderStages.map((stage, idx) => {
              const isPassed = currentStageIndex >= idx;
              const isCurrent = currentStageIndex === idx;

              return (
                <div key={idx} className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isPassed
                        ? 'bg-[#00A896] text-white shadow-md shadow-[#00A896]/25 ring-4 ring-[#00A896]/20'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <span className={`text-xs block ${isPassed ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                      {stage.label}
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                      {stage.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Items & Shipping Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Shipment Items */}
        <div className="lg:col-span-7">
          <Card className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
            <h3 className="font-bold text-[#0A2540] text-sm border-b border-slate-100 pb-3">
              Pharmaceuticals & Items in this Package
            </h3>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50/50">
                  <div>
                    <span className="font-bold text-slate-900 block">{item.product_name}</span>
                    <span className="text-slate-400 text-[11px]">Quantity: {item.quantity} units</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatCurrency(item.total_price)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#00A896]" />
                <span>Cold-Chain Insulated Medical Bag</span>
              </span>
              <span>Batch Verified</span>
            </div>
          </Card>
        </div>

        {/* Right: Shipping Destination & Payment Card */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 rounded-3xl border border-slate-200 bg-white space-y-3 shadow-xs">
            <h3 className="font-bold text-[#0A2540] text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#00A896]" />
              <span>Delivery Address</span>
            </h3>
            {order.shipping_address && (
              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="font-bold text-slate-900">{order.shipping_address.full_name}</div>
                <div>{order.shipping_address.address_line1}</div>
                <div>
                  {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postal_code}
                </div>
                <div className="text-slate-400 mt-1">Phone: {order.shipping_address.phone}</div>
              </div>
            )}
          </Card>

          <Card className="p-6 rounded-3xl border border-slate-200 bg-white space-y-2 text-xs shadow-xs">
            <h3 className="font-bold text-[#0A2540] text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#00A896]" />
              <span>Payment & Invoice Breakdown</span>
            </h3>
            <div className="flex justify-between text-slate-500 pt-1">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Express Delivery Fee</span>
              <span>{formatCurrency(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Taxes & Cess</span>
              <span className="text-emerald-600 font-semibold">Included</span>
            </div>
            <div className="flex justify-between font-black text-base text-[#0A2540] pt-3 border-t border-slate-100">
              <span>Total Paid</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
