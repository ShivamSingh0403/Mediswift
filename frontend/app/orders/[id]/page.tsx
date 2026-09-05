'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { orderService } from '@/services/order-service';
import { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle2, Clock, Truck, PackageCheck, MapPin, ArrowLeft } from 'lucide-react';

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
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">Loading order tracking...</div>;
  }

  if (!order) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">Order not found.</div>;
  }

  const steps = [
    { label: 'Order Confirmed', completed: true },
    { label: 'Packed by Pharmacist', completed: ['PROCESSING', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) },
    { label: 'Dispatched for Delivery', completed: ['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) },
    { label: 'Delivered', completed: order.status === 'DELIVERED' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0A2540] mb-6">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Orders</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]">Order {order.order_number}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Placed on {formatDate(order.created_at)} • Tracking ID: <span className="font-mono">{order.tracking_number}</span>
          </p>
        </div>
        <Badge variant="success" className="text-sm px-3 py-1">
          {order.status_display}
        </Badge>
      </div>

      {/* Visual Tracking Progress Timeline */}
      <Card className="p-6 mb-8">
        <h3 className="font-bold text-[#0A2540] text-sm mb-6 flex items-center gap-2">
          <Truck className="h-4 w-4 text-[#00A896]" />
          <span>Delivery Progress Timeline</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  step.completed
                    ? 'bg-[#00A896] text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {step.completed ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              </div>
              <span className={`text-xs ${step.completed ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Order Items List */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-[#0A2540] text-sm border-b border-slate-100 pb-3">
              Items in this shipment
            </h3>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{item.product_name}</span>
                    <span className="text-slate-400 ml-2">x {item.quantity}</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatCurrency(item.total_price)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="md:col-span-5 space-y-4">
          <Card className="p-6 space-y-3">
            <h3 className="font-bold text-[#0A2540] text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#00A896]" />
              <span>Shipping Destination</span>
            </h3>
            {order.shipping_address && (
              <div className="text-xs text-slate-600 leading-relaxed">
                <div className="font-bold text-slate-800">{order.shipping_address.full_name}</div>
                <div>{order.shipping_address.address_line1}</div>
                <div>
                  {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postal_code}
                </div>
                <div className="text-slate-400 mt-1">Phone: {order.shipping_address.phone}</div>
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Delivery Fee</span>
              <span>{formatCurrency(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-[#0A2540] pt-2 border-t border-slate-100">
              <span>Total Paid</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
