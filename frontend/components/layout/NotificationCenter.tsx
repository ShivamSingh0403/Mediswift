'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  Package,
  CreditCard,
  FileText,
  Calendar,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useNotificationStore } from '@/store/notification-store';
import { useAuthStore } from '@/store/auth-store';
import { NotificationItem } from '@/types';

export function NotificationCenter() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    isLoading,
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!isAuthenticated) {
    return null;
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'ALL') return true;
    return n.notification_type === filter;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
        return <Package className="h-4 w-4 text-emerald-600" />;
      case 'PAYMENT':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'PRESCRIPTION':
        return <FileText className="h-4 w-4 text-teal-600" />;
      case 'APPOINTMENT':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'PROMOTION':
        return <Sparkles className="h-4 w-4 text-amber-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.is_read) {
      await markAsRead(n.id);
    }
    setIsOpen(false);
    if (n.action_url) {
      router.push(n.action_url);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#00A896] transition-colors cursor-pointer"
        aria-label="View notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-xs animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200/90 bg-white shadow-2xl z-50 overflow-hidden flex flex-col max-h-[520px]"
          >
            {/* Header */}
            <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-teal-100 text-[#00A896] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="text-xs text-[#00A896] hover:text-teal-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 overflow-x-auto text-[11px] bg-white scrollbar-none">
              {[
                { label: 'All', value: 'ALL' },
                { label: 'Orders', value: 'ORDER' },
                { label: 'Payments', value: 'PAYMENT' },
                { label: 'Rx', value: 'PRESCRIPTION' },
                { label: 'Visits', value: 'APPOINTMENT' },
                { label: 'Offers', value: 'PROMOTION' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setFilter(tab.value)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    filter === tab.value
                      ? 'bg-[#00A896] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No notifications here</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    We&apos;ll notify you about orders, delivery, appointments, and payments.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3 transition-colors cursor-pointer flex items-start gap-3 text-left ${
                      n.is_read ? 'bg-white hover:bg-slate-50/70' : 'bg-teal-50/40 hover:bg-teal-50/70'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100/90 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {getNotificationIcon(n.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`text-xs truncate ${n.is_read ? 'font-medium text-slate-800' : 'font-bold text-slate-900'}`}>
                          {n.title}
                        </h4>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[#00A896] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                        <span>{new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {n.action_url && (
                          <span className="flex items-center gap-0.5 text-[#00A896] font-medium">
                            View <ExternalLink className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
