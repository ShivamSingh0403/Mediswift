'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, ShoppingBag, Users, Stethoscope, FileText, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface Metrics {
  total_sales_inr: string | number;
  total_orders: number;
  total_customers: number;
  total_doctors: number;
  total_appointments: number;
  pending_prescriptions: number;
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await apiClient.get('/analytics/summary/');
        if (res?.data?.data?.metrics) {
          setMetrics(res.data.data.metrics);
        }
      } catch {
        // Handle unauthorized or fallback
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-[#0A2540]">Operations Dashboard</h1>
            <Badge variant="accent">Administrator</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time analytics for orders, pharmacy dispensary, and doctor telehealth consultations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-7 w-7" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Gross Medicine Sales</div>
            <div className="text-2xl font-black text-[#0A2540] mt-0.5">
              {formatCurrency(metrics?.total_sales_inr || 0)}
            </div>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-teal-50 text-[#00A896]">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Orders Fulfilled</div>
            <div className="text-2xl font-black text-[#0A2540] mt-0.5">
              {metrics?.total_orders || 0}
            </div>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Prescriptions Awaiting Review</div>
            <div className="text-2xl font-black text-[#0A2540] mt-0.5">
              {metrics?.pending_prescriptions || 0}
            </div>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Registered Patients</div>
            <div className="text-2xl font-black text-[#0A2540] mt-0.5">
              {metrics?.total_customers || 0}
            </div>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <Stethoscope className="h-7 w-7" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Active Telehealth Doctors</div>
            <div className="text-2xl font-black text-[#0A2540] mt-0.5">
              {metrics?.total_doctors || 0}
            </div>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-50 text-[#028090]">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Telehealth Sessions</div>
            <div className="text-2xl font-black text-[#0A2540] mt-0.5">
              {metrics?.total_appointments || 0}
            </div>
          </div>
        </Card>
      </div>

      {/* Catalog & Image Management Hub Quick Action */}
      <div className="mt-8">
        <Link href="/admin/images">
          <Card className="p-6 bg-gradient-to-r from-teal-500/10 via-slate-50 to-emerald-500/10 border-teal-200 hover:border-[#00A896] transition-all cursor-pointer group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#00A896] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#00A896]/20">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-[#0A2540] text-base group-hover:text-[#00A896] transition-colors">
                      Product Image Management & Verification Hub
                    </h3>
                    <Badge variant="accent">New Workflow</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Verify official pharmaceutical packaging photos, inspect placeholders, and batch-import image archives by exact SKU.
                  </p>
                </div>
              </div>
              <div className="text-xs font-bold text-[#00A896] flex items-center gap-1 group-hover:translate-x-1 transition-transform whitespace-nowrap">
                <span>Open Image Hub</span>
                <span>→</span>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
