'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { orderService } from '@/services/order-service';
import { Order } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ProductImage } from '@/components/ProductImage';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Package,
  Clock,
  ChevronRight,
  Truck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default function AccountOrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    async function loadOrders() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        const res = await orderService.getOrders();
        if (res?.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
          setOrders(list);
        }
      } catch {
        // Silently handled
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-teal-50 text-[#00A896] flex items-center justify-center mx-auto mb-4">
          <Package className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#0A2540]">Sign In to View Orders</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6 max-w-sm mx-auto">
          Sign in to your authenticated MediSwift account to track medicine dispatches, inspect invoices, and reorder.
        </p>
        <Link href="/login">
          <Button variant="primary">Sign In / Register</Button>
        </Link>
      </div>
    );
  }

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'DELIVERED') return order.status === 'DELIVERED';
    if (filterStatus === 'ACTIVE') return !['DELIVERED', 'CANCELLED'].includes(order.status);
    if (filterStatus === 'CANCELLED') return order.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Navigation & Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#00A896] mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Account</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540]">My Orders</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track real-time delivery checkpoints, download invoices, and reorder medicines.
          </p>
        </div>

        <Link href="/medicines">
          <Button variant="outline" size="sm" className="rounded-xl self-start sm:self-auto">
            <ShoppingBag className="h-4 w-4 mr-1.5" />
            <span>Shop Catalog</span>
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      {orders.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: `All Orders (${orders.length})` },
            {
              id: 'ACTIVE',
              label: `In Transit / Active (${orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status)).length})`,
            },
            {
              id: 'DELIVERED',
              label: `Delivered (${orders.filter((o) => o.status === 'DELIVERED').length})`,
            },
            {
              id: 'CANCELLED',
              label: `Cancelled (${orders.filter((o) => o.status === 'CANCELLED').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-[#00A896] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-6 rounded-3xl bg-white border border-slate-200/80 animate-pulse space-y-4">
              <div className="h-5 w-48 bg-slate-100 rounded" />
              <div className="h-12 bg-slate-100 rounded-xl" />
              <div className="h-4 w-32 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredOrders.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">
            {filterStatus === 'ALL' ? 'No orders placed yet' : `No ${filterStatus.toLowerCase()} orders`}
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-6 max-w-sm mx-auto">
            {filterStatus === 'ALL'
              ? 'You have not placed any orders yet. Explore our verified pharmacy catalog for genuine healthcare essentials.'
              : `You have no orders matching the ${filterStatus.toLowerCase()} filter.`}
          </p>
          <Link href="/medicines">
            <Button variant="primary" size="md">Browse Medicines</Button>
          </Link>
        </div>
      )}

      {/* Orders List */}
      {!loading && filteredOrders.length > 0 && (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const payment = order.payments?.[0];
            const paymentStatus = order.payment_status || payment?.status || (order.status === 'CONFIRMED' ? 'PAID' : 'PENDING');
            const isPaid = paymentStatus === 'PAID';

            return (
              <Card
                key={order.id}
                className="p-5 sm:p-6 rounded-3xl border border-slate-200/90 bg-white shadow-xs hover:border-[#00A896]/30 transition-all duration-200"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-sm sm:text-base text-[#0A2540]">
                      {order.order_number}
                    </span>
                    <Badge variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'primary'}>
                      {order.status_display || order.status}
                    </Badge>
                    <Badge variant={isPaid ? 'success' : 'warning'}>
                      {isPaid ? 'PAID' : 'PAYMENT PENDING'}
                    </Badge>
                  </div>

                  <span className="text-xs text-slate-400">
                    Placed on {formatDate(order.created_at)}
                  </span>
                </div>

                {/* Items Preview */}
                <div className="py-4">
                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2.5 p-2 rounded-2xl bg-slate-50 border border-slate-100 shrink-0 max-w-[240px]"
                      >
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
                        <div className="min-w-0 pr-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {item.product_name}
                          </h4>
                          <span className="text-[10px] text-slate-400 block">
                            Qty: {item.quantity} • {formatCurrency(item.unit_price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.tracking_number && (
                    <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-[#00A896]" />
                      <span>Tracking: <strong className="font-mono text-slate-700">{order.tracking_number}</strong> ({order.courier_name})</span>
                    </div>
                  )}
                </div>

                {/* Order Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Order Total</span>
                    <span className="text-base font-black text-[#0A2540]">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/account/orders/${order.id}`}>
                      <Button variant="primary" size="sm" className="rounded-xl font-bold">
                        <span>View Order</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
