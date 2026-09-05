'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { orderService } from '@/services/order-service';
import { Order } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Package, Clock, ChevronRight, Truck } from 'lucide-react';

export default function OrdersListPage() {
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        const res = await orderService.getOrders();
        if (res?.data?.results) setOrders(res.data.results);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Package className="h-12 w-12 text-[#00A896] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#0A2540]">Sign In to Track Orders</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          View your past medicine purchases, live courier updates, and invoices.
        </p>
        <Link href="/account">
          <Button variant="primary">Login / Register</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0A2540]">Medicine Orders & Tracking</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor your orders with real-time status updates and delivery tracking numbers.
        </p>
      </div>

      {orders.length === 0 && !loading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
          <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">No orders placed yet</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">You haven&apos;t placed any medicine orders yet.</p>
          <Link href="/medicines">
            <Button size="sm" variant="outline">Browse Catalog</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-6 glass-card-hover">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#00A896] flex items-center justify-center shrink-0">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0A2540] text-base">{order.order_number}</span>
                      <Badge variant="success">{order.status_display}</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Placed on {formatDate(order.created_at)} • {order.items?.length || 0} item(s)
                    </div>
                    {order.tracking_number && (
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        Tracking: {order.tracking_number}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#0A2540]">
                      {formatCurrency(order.total_amount)}
                    </div>
                    <div className="text-[11px] text-slate-400">Total Amount</div>
                  </div>

                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline" size="sm">
                      <span>View Status</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
