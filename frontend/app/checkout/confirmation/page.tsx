'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { orderService } from '@/services/order-service';
import { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ProductImage } from '@/components/ProductImage';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';

function OrderConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || searchParams.get('id');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }
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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-4 border-[#00A896]/20 border-t-[#00A896] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Verifying transaction and preparing order confirmation...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
        <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Order Reference Not Found</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          We could not load an active order confirmation. Please check your order history.
        </p>
        <Link href="/account/orders">
          <Button variant="primary">Go to My Orders</Button>
        </Link>
      </div>
    );
  }

  const address = order.shipping_address_snapshot || order.shipping_address;
  const paymentRecord = order.payments?.[0];
  const paymentStatus = order.payment_status || paymentRecord?.status || (order.status === 'CONFIRMED' ? 'PAID' : 'PENDING');
  const isPaid = paymentStatus === 'PAID';

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
      {/* Success Hero Card */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-500/10 animate-bounce duration-1000">
          <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540]">
          Order Confirmed!
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
          Thank you for choosing MediSwift. Your healthcare order has been logged into our centralized dispensary network.
        </p>
      </div>

      {/* Confirmation Details Card */}
      <Card className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-md space-y-6">
        {/* Order Identifier & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Customer Order Number
            </span>
            <span className="text-xl font-black text-[#0A2540]">{order.order_number}</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success">Confirmed</Badge>
            <Badge variant={isPaid ? 'success' : 'warning'}>
              {isPaid ? 'Payment Received' : 'Cash on Delivery'}
            </Badge>
          </div>
        </div>

        {/* Itemized Products */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Ordered Medications ({order.items?.length || 0})
          </h3>
          <div className="divide-y divide-slate-100">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl bg-white border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                    <ProductImage
                      product={{
                        name: item.product_name,
                        image_url: item.product_image,
                        primary_image: item.product_image,
                        dosage_form: 'MEDICINE',
                        category_name: 'Pharmacy',
                      }}
                      className="w-full h-full"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{item.product_name}</span>
                    <span className="text-slate-400 text-[11px]">
                      Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                    </span>
                  </div>
                </div>

                <span className="font-bold text-slate-900">{formatCurrency(item.total_price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address & Courier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#00A896]" /> Delivery Destination
            </span>
            {address ? (
              <div className="text-slate-600 space-y-0.5">
                <span className="font-bold text-slate-900 block">{address.full_name}</span>
                <span>{address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ''}</span>
                <span className="block">{address.city}, {address.state} - {address.postal_code}</span>
                <span className="text-slate-400 text-[11px] block">Contact: {address.phone}</span>
              </div>
            ) : (
              <span className="text-slate-400">Address recorded on order.</span>
            )}
          </div>

          <div>
            <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1 flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5 text-[#00A896]" /> Payment Summary
            </span>
            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <strong className={isPaid ? 'text-emerald-600' : 'text-amber-600'}>{paymentStatus}</strong>
              </div>
              <div className="flex justify-between">
                <span>Method:</span>
                <span>{paymentRecord?.provider_display || order.payment_method || 'Online'}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-[#0A2540] pt-1 border-t border-slate-100">
                <span>Total Paid:</span>
                <span className="text-[#00A896]">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link href="/medicines" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full rounded-2xl">
              <ShoppingBag className="h-4 w-4 mr-1.5" /> Continue Shopping
            </Button>
          </Link>

          <Link href={`/account/orders/${order.id}`} className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full rounded-2xl font-bold shadow-md shadow-[#00A896]/20">
              <span>View Order Details</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="w-12 h-12 border-4 border-[#00A896]/20 border-t-[#00A896] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading order confirmation...</p>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
