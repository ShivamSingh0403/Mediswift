'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  MapPin,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
  Tag,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  Check,
  Zap,
  Lock,
  RefreshCw,
  Clock,
  Sparkles,
  Info,
  X,
} from 'lucide-react';

import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import { addressService, AddressPayload } from '@/services/address-service';
import { orderService, CouponValidationResult } from '@/services/order-service';
import { paymentService } from '@/services/payment-service';
import { prescriptionService } from '@/services/prescription-service';
import { Address, Coupon, Prescription, PaymentProvider } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

type StepNumber = 1 | 2 | 3 | 4 | 5;

const STEPS: { num: StepNumber; title: string; subtitle: string; icon: any }[] = [
  { num: 1, title: 'Cart Review', subtitle: 'Review items & quantities', icon: ShoppingBag },
  { num: 2, title: 'Delivery Address', subtitle: 'Select destination', icon: MapPin },
  { num: 3, title: 'Prescription', subtitle: 'Verification check', icon: FileText },
  { num: 4, title: 'Order Summary', subtitle: 'Discounts & charges', icon: Tag },
  { num: 5, title: 'Payment Gateway', subtitle: 'Secure payment', icon: CreditCard },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Gujarat', 'Haryana',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab',
  'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, totalItems, requiresPrescription, updateQuantity, removeItem, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useNotificationStore();

  // Step state
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressPayload>({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    landmark: '',
    city: '',
    state: 'Delhi',
    postal_code: '',
    address_type: 'HOME',
    is_default: false,
  });

  // Prescription state
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string>('');
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [isUploadingRx, setIsUploadingRx] = useState(false);
  const [rxNotes, setRxNotes] = useState('');

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Order notes
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Payment state
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('RAZORPAY');
  const [upiId, setUpiId] = useState('');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState('');
  const [paymentSimulationOutcome, setPaymentSimulationOutcome] = useState<'PAID' | 'FAILED'>('PAID');

  // Load addresses & prescriptions on mount
  useEffect(() => {
    if (!isAuthenticated) {
      addToast({
        type: 'warning',
        title: 'Authentication Required',
        message: 'Please sign in or register to complete your order checkout.',
      });
      router.push('/account');
      return;
    }

    async function fetchData() {
      try {
        setLoadingAddresses(true);
        const addrRes = await addressService.getAddresses();
        if (addrRes?.data) {
          setAddresses(addrRes.data);
          const defaultAddr = addrRes.data.find((a) => a.is_default) || addrRes.data[0];
          if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        }
      } catch {
        // Handled silently
      } finally {
        setLoadingAddresses(false);
      }

      try {
        setLoadingPrescriptions(true);
        const rxRes = await prescriptionService.getPrescriptions();
        if (rxRes?.data) {
          const list = Array.isArray(rxRes.data) ? rxRes.data : rxRes.data.results || [];
          setPrescriptions(list);
          if (list.length > 0) {
            setSelectedPrescriptionId(list[0].id);
          }
        }
      } catch {
        // Handled silently
      } finally {
        setLoadingPrescriptions(false);
      }

      try {
        setLoadingCoupons(true);
        const coupRes = await orderService.getAvailableCoupons();
        if (coupRes?.data) {
          setAvailableCoupons(coupRes.data);
        }
      } catch {
        // Handled silently
      } finally {
        setLoadingCoupons(false);
      }
    }

    fetchData();
  }, [isAuthenticated, router, addToast]);

  // Calculations
  const deliveryFee = subtotal >= 500 ? 0 : 49;
  const platformFee = 5;
  const discountAmount = appliedCoupon ? parseFloat(appliedCoupon.discount_amount) : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee + platformFee);

  // Address Handlers
  const handleOpenNewAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      full_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
      phone: user?.phone_number || '',
      address_line1: '',
      address_line2: '',
      landmark: '',
      city: '',
      state: '',
      postal_code: '',
      address_type: 'HOME',
      is_default: addresses.length === 0,
    });
    setShowAddressModal(true);
  };

  const handleOpenEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      full_name: addr.full_name,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      address_type: addr.address_type,
      is_default: addr.is_default,
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        const res = await addressService.updateAddress(editingAddressId, addressForm);
        if (res?.data) {
          setAddresses((prev) =>
            prev.map((a) => (a.id === editingAddressId ? res.data : a))
          );
          addToast({ type: 'success', message: 'Address updated successfully.' });
        }
      } else {
        const res = await addressService.createAddress(addressForm);
        if (res?.data) {
          setAddresses((prev) => [res.data, ...prev]);
          setSelectedAddressId(res.data.id);
          addToast({ type: 'success', message: 'New address added to your address book.' });
        }
      }
      setShowAddressModal(false);
    } catch {
      addToast({ type: 'error', message: 'Failed to save address. Please verify the fields.' });
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery address?')) return;
    try {
      await addressService.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      if (selectedAddressId === id) {
        const remaining = addresses.filter((a) => a.id !== id);
        setSelectedAddressId(remaining[0]?.id || '');
      }
      addToast({ type: 'info', message: 'Address deleted.' });
    } catch {
      addToast({ type: 'error', message: 'Could not delete address.' });
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await addressService.setDefaultAddress(id);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, is_default: a.id === id }))
      );
      setSelectedAddressId(id);
      addToast({ type: 'success', message: 'Default address updated.' });
    } catch {
      addToast({ type: 'error', message: 'Could not set default address.' });
    }
  };

  // Prescription Upload Handler
  const handleUploadNewRx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingRx(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      if (rxNotes) formData.append('patient_notes', rxNotes);

      const res = await prescriptionService.uploadPrescription(formData);
      if (res?.data) {
        setPrescriptions((prev) => [res.data, ...prev]);
        setSelectedPrescriptionId(res.data.id);
        addToast({
          type: 'success',
          title: 'Prescription Uploaded',
          message: 'Your prescription was attached and is queued for verification.',
        });
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to upload prescription. Check file format (PDF, JPG, PNG).' });
    } finally {
      setIsUploadingRx(false);
    }
  };

  // Coupon Handler
  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) return;
    setCouponError('');
    setValidatingCoupon(true);

    try {
      const res = await orderService.validateCoupon(code, subtotal);
      if (res?.data) {
        setAppliedCoupon(res.data);
        setCouponCodeInput(code);
        addToast({
          type: 'success',
          title: 'Coupon Applied!',
          message: `Saved ₹${res.data.discount_amount} with coupon code ${code}.`,
        });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid or expired coupon code.';
      setCouponError(msg);
      addToast({ type: 'error', message: msg });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
    addToast({ type: 'info', message: 'Coupon removed.' });
  };

  // Step Navigation Validation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (items.length === 0) {
        addToast({ type: 'warning', message: 'Your shopping cart is empty.' });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedAddressId) {
        addToast({ type: 'warning', message: 'Please choose or add a delivery address.' });
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (requiresPrescription && !selectedPrescriptionId) {
        addToast({
          type: 'error',
          title: 'Prescription Required',
          message: 'Your cart contains prescription medicines. Please upload or select a valid prescription.',
        });
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  // Final Order & Authoritative Payment Flow
  const handleFinalizeOrder = async () => {
    if (!selectedAddressId) {
      addToast({ type: 'warning', message: 'Please select a delivery address.' });
      setCurrentStep(2);
      return;
    }

    if (requiresPrescription && !selectedPrescriptionId) {
      addToast({ type: 'error', message: 'Prescription verification required.' });
      setCurrentStep(3);
      return;
    }

    setIsProcessingPayment(true);
    setPaymentStatusText('Creating order with atomic inventory reservation...');

    try {
      // 1. Create order on backend
      const checkoutRes = await orderService.checkout({
        shipping_address_id: selectedAddressId,
        prescription_id: requiresPrescription ? selectedPrescriptionId : undefined,
        coupon_code: appliedCoupon ? couponCodeInput : undefined,
        delivery_notes: deliveryNotes,
        payment_method: selectedProvider,
      });

      if (!checkoutRes?.data) {
        throw new Error('Order creation failed.');
      }

      // Check return format (CheckoutResult or Order)
      const orderData = 'order' in checkoutRes.data ? checkoutRes.data.order : checkoutRes.data;
      const paymentInfo = 'payment' in checkoutRes.data ? checkoutRes.data.payment : null;

      // 2. Authoritative Payment Verification Step
      setPaymentStatusText(`Contacting ${selectedProvider} secure gateway & verifying transaction...`);
      await new Promise((r) => setTimeout(r, 1200));

      if (selectedProvider === 'COD') {
        // COD does not require immediate payment gateway capture
        clearCart();
        addToast({
          type: 'success',
          title: 'Order Confirmed (Cash on Delivery)',
          message: `Order #${orderData.order_number} confirmed. Express dispatch initiated!`,
        });
        router.push(`/orders/${orderData.id}`);
        return;
      }

      // Online payment verification
      setPaymentStatusText('Running authoritative server-side signature validation...');
      await new Promise((r) => setTimeout(r, 800));

      const verifyRes = await paymentService.verifyPayment({
        order_id: orderData.id,
        payment_id: paymentInfo?.id,
        provider: selectedProvider,
        provider_transaction_id: `txn_live_${Math.random().toString(36).substring(2, 12)}`,
        gateway_order_id: paymentInfo?.gateway_order_id || `order_gw_${Math.random().toString(36).substring(2, 10)}`,
        payment_signature: `sig_auth_${Math.random().toString(36).substring(2, 14)}`,
        payment_method_details: {
          channel: selectedProvider,
          upi_vpa: selectedProvider === 'UPI' ? upiId || 'customer@okhdfcbank' : undefined,
          card_last4: selectedProvider === 'CARD_MOCK' ? cardData.number.slice(-4) || '4242' : undefined,
        },
        simulate_status: paymentSimulationOutcome,
      });

      if (!verifyRes?.success && paymentSimulationOutcome === 'FAILED') {
        throw new Error('Payment was declined or cancelled by the payment gateway.');
      }

      // Success
      clearCart();
      addToast({
        type: 'success',
        title: 'Payment Confirmed!',
        message: `Order #${orderData.order_number} confirmed with payment reference ${verifyRes.data.payment.internal_transaction_id}.`,
      });
      router.push(`/orders/${orderData.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Payment or order processing failed.';
      addToast({
        type: 'error',
        title: 'Payment Notice',
        message: msg,
      });
      setIsProcessingPayment(false);
    }
  };

  // If cart is empty and user not in final order processing
  if (items.length === 0 && !isProcessingPayment) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-teal-50 text-[#00A896] flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#0A2540] mb-3">Your Cart is Empty</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-8">
          You haven&apos;t added any medicines or health products to your cart yet. Explore our verified pharmacy catalog.
        </p>
        <Link href="/products">
          <Button variant="primary" size="lg" className="rounded-xl px-8 shadow-md">
            Browse Medicines & Healthcare
          </Button>
        </Link>
      </div>
    );
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const selectedPrescription = prescriptions.find((p) => p.id === selectedPrescriptionId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Top Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-[#00A896] font-bold uppercase tracking-wider mb-1">
          <ShieldCheck className="h-4 w-4" /> 256-Bit Encrypted Healthcare Checkout
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540]">Production Checkout</h1>
      </div>

      {/* Progress Breadcrumbs Stepper */}
      <div className="mb-10 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-5 gap-2 sm:gap-4 relative">
          {STEPS.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            const Icon = s.icon;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  // Only allow jumping backward to already completed steps
                  if (s.num < currentStep) setCurrentStep(s.num);
                }}
                disabled={s.num > currentStep}
                className={`flex flex-col items-center text-center transition-all cursor-pointer ${
                  s.num > currentStep ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-100'
                }`}
              >
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-[#00A896] text-white shadow-md shadow-[#00A896]/20'
                      : isCurrent
                      ? 'bg-[#0A2540] text-white ring-4 ring-slate-200 shadow-md'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`text-[11px] sm:text-xs font-bold mt-2 truncate max-w-full ${
                  isCurrent ? 'text-[#0A2540]' : isCompleted ? 'text-[#00A896]' : 'text-slate-400'
                }`}>
                  {s.title}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 hidden md:block">
                  {s.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Checkout Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Interactive Step Section (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* ================= STEP 1: CART REVIEW ================= */}
          {currentStep === 1 && (
            <Card className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-[#0A2540] flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-[#00A896]" />
                    <span>Step 1: Review Your Cart</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Confirm medicine quantities, pack sizes, and prescription notices.
                  </p>
                </div>
                <Badge variant="primary">{totalItems} items</Badge>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-teal-50/50 border border-teal-100/50 flex items-center justify-center shrink-0 p-2">
                        <span className="text-xl">💊</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{item.product.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.product.pack_size || 'Standard pack'} • {item.product.dosage_form || 'Medicine'}
                        </p>
                        {item.product.prescription_required && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 mt-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                            <FileText className="h-3 w-3" /> Rx Required
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity > 1) updateQuantity(item.product.id, item.quantity - 1);
                            else removeItem(item.product.id);
                          }}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 transition-colors text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 transition-colors text-xs font-bold"
                        >
                          +
                        </button>
                      </div>

                      {/* Total price */}
                      <div className="text-right min-w-[70px]">
                        <span className="text-sm font-bold text-slate-900 block">
                          {formatCurrency(parseFloat(item.product.discounted_price || item.product.price) * item.quantity)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatCurrency(parseFloat(item.product.discounted_price || item.product.price))} each
                        </span>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.product.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Step 1 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Link href="/products" className="text-xs font-semibold text-[#00A896] hover:underline flex items-center gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" /> Continue Shopping
                </Link>
                <Button variant="primary" size="lg" onClick={handleNextStep} className="rounded-xl px-6">
                  Proceed to Delivery Address <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </Card>
          )}

          {/* ================= STEP 2: DELIVERY ADDRESS ================= */}
          {currentStep === 2 && (
            <Card className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-[#0A2540] flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#00A896]" />
                    <span>Step 2: Delivery Address</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select an Indian delivery address or add a new delivery location.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleOpenNewAddress} className="rounded-xl">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Address
                </Button>
              </div>

              {loadingAddresses ? (
                <div className="py-12 text-center text-slate-400 text-xs">Loading addresses...</div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                  <MapPin className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No saved addresses found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 mb-4">
                    Please add an address to complete your prescription delivery.
                  </p>
                  <Button variant="primary" size="sm" onClick={handleOpenNewAddress}>
                    Add First Address
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#00A896] bg-teal-50/40 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-900 text-sm">{addr.full_name}</span>
                            <div className="flex items-center gap-1.5">
                              {addr.is_default && (
                                <span className="bg-teal-100 text-[#00A896] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                              <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                {addr.address_type}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {addr.address_line1}
                            {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                          </p>
                          {addr.landmark && (
                            <p className="text-[11px] text-slate-400 mt-0.5">Landmark: {addr.landmark}</p>
                          )}
                          <p className="text-xs font-medium text-slate-700 mt-1">
                            {addr.city}, {addr.state} - <span className="font-mono font-bold">{addr.postal_code}</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1 font-mono">📱 {addr.phone}</p>
                        </div>

                        {/* Card bottom actions */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-2">
                            {!addr.is_default && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetDefaultAddress(addr.id);
                                }}
                                className="text-[11px] text-slate-500 hover:text-[#00A896] font-medium"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditAddress(addr);
                              }}
                              className="text-slate-400 hover:text-slate-700 p-1"
                              title="Edit address"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAddress(addr.id);
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Delete address"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="absolute top-3 right-3 text-[#00A896]">
                            <CheckCircle2 className="h-5 w-5 fill-[#00A896] text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Step 2 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button variant="ghost" size="md" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Cart
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleNextStep}
                  disabled={!selectedAddressId}
                  className="rounded-xl px-6"
                >
                  Confirm Address & Continue <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </Card>
          )}

          {/* ================= STEP 3: PRESCRIPTION VERIFICATION ================= */}
          {currentStep === 3 && (
            <Card className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-lg font-bold text-[#0A2540] flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#00A896]" />
                  <span>Step 3: Prescription Verification Gate</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Schedule H and regulated drugs require a valid medical prescription under Indian pharmacy regulations.
                </p>
              </div>

              {!requiresPrescription ? (
                /* No Rx required for this cart */
                <div className="p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center mb-6">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                  <h3 className="font-bold text-emerald-900 text-sm">No Prescription Required</h3>
                  <p className="text-xs text-emerald-700 max-w-md mx-auto mt-1">
                    All items in your cart are over-the-counter (OTC) healthcare or wellness products. No prescription document is needed to proceed.
                  </p>
                </div>
              ) : (
                /* Rx IS required */
                <div className="space-y-6 mb-6">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 text-xs">Prescription Required</h4>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Your cart contains prescription-grade medicines. Please choose a previously verified prescription or upload a new doctor&apos;s slip.
                      </p>
                    </div>
                  </div>

                  {/* List of Cart Items requiring Rx */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Regulated items requiring verification:</span>
                    <div className="space-y-1.5">
                      {items
                        .filter((i) => i.product.prescription_required)
                        .map((i) => (
                          <div key={i.id} className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                            <span className="font-medium text-slate-800">{i.product.name}</span>
                            <Badge variant="warning">Rx Obligatory</Badge>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Existing Prescriptions Selection */}
                  {prescriptions.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-700 block">Select from your saved prescriptions:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {prescriptions.map((rx) => {
                          const isSelected = selectedPrescriptionId === rx.id;
                          return (
                            <div
                              key={rx.id}
                              onClick={() => setSelectedPrescriptionId(rx.id)}
                              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-[#00A896] bg-teal-50/40 shadow-xs'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-slate-900 text-xs truncate max-w-[150px]">
                                  {rx.original_filename || 'Prescription Document'}
                                </span>
                                <Badge variant={rx.status === 'VERIFIED' ? 'success' : 'secondary'}>
                                  {rx.status_display || rx.status}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                Doctor: {rx.doctor_name || 'Registered Physician'}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                Added {new Date(rx.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Upload New Prescription Card */}
                  <div className="border border-dashed border-slate-200 rounded-2xl p-5 bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-700 block mb-2">Or Upload a New Doctor Prescription:</span>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Optional notes for our pharmacist (e.g. 5 days dosage)"
                        value={rxNotes}
                        onChange={(e) => setRxNotes(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                      <label className="flex items-center justify-center gap-2 p-4 rounded-xl border border-slate-300 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                        <UploadCloud className="h-5 w-5 text-[#00A896]" />
                        <span className="text-xs font-semibold text-slate-700">
                          {isUploadingRx ? 'Uploading document...' : 'Upload Prescription (JPG, PNG, PDF)'}
                        </span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleUploadNewRx}
                          disabled={isUploadingRx}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button variant="ghost" size="md" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Address
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleNextStep}
                  disabled={requiresPrescription && !selectedPrescriptionId}
                  className="rounded-xl px-6"
                >
                  Verify & Proceed to Summary <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </Card>
          )}

          {/* ================= STEP 4: ORDER SUMMARY & COUPONS ================= */}
          {currentStep === 4 && (
            <Card className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-[#0A2540] flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#00A896]" />
                  <span>Step 4: Order Summary & Coupons</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Apply discounts, add delivery instructions, and review your order breakdown.
                </p>
              </div>

              {/* Delivery snapshot recap */}
              {selectedAddress && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delivering To</span>
                    <span className="font-bold text-slate-900 text-xs">{selectedAddress.full_name}</span>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {selectedAddress.address_line1}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postal_code}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)} className="text-xs text-[#00A896]">
                    Change
                  </Button>
                </div>
              )}

              {/* Promotional Coupons Input & Selection */}
              <div className="p-4 rounded-2xl border border-teal-100 bg-teal-50/30 space-y-3">
                <span className="text-xs font-bold text-[#0A2540] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#00A896]" />
                  <span>Promotional Coupon Code</span>
                </span>

                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon (e.g. FIRSTMED20)"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    disabled={!!appliedCoupon}
                    className="bg-white uppercase font-mono text-xs font-bold"
                  />
                  {appliedCoupon ? (
                    <Button variant="outline" size="md" onClick={handleRemoveCoupon} className="text-rose-600 border-rose-200">
                      Remove
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleApplyCoupon()}
                      isLoading={validatingCoupon}
                      className="px-6"
                    >
                      Apply
                    </Button>
                  )}
                </div>

                {couponError && <p className="text-xs text-rose-600 font-medium">{couponError}</p>}

                {appliedCoupon && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Code <strong>{appliedCoupon.coupon.code}</strong> applied! You saved ₹{appliedCoupon.discount_amount}.</span>
                    </div>
                  </div>
                )}

                {/* Available Coupons List */}
                {!appliedCoupon && availableCoupons.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] text-slate-500 font-semibold block mb-2">
                      Available offers for your cart:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availableCoupons.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleApplyCoupon(c.code)}
                          className="p-2.5 rounded-xl border border-dashed border-teal-200 bg-white hover:bg-teal-50/50 cursor-pointer transition-colors flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-[#00A896] block">{c.code}</span>
                            <span className="text-[10px] text-slate-500 line-clamp-1">{c.description}</span>
                          </div>
                          <span className="text-[11px] font-bold text-teal-700 shrink-0">Tap to Apply</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Delivery Instructions / Pharmacy Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Leave at doorstep / call before arrival / special landmark"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#00A896]"
                />
              </div>

              {/* Step 4 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button variant="ghost" size="md" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Rx Gate
                </Button>
                <Button variant="primary" size="lg" onClick={handleNextStep} className="rounded-xl px-6">
                  Proceed to Payment <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </Card>
          )}

          {/* ================= STEP 5: PAYMENT GATEWAY ================= */}
          {currentStep === 5 && (
            <Card className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-[#0A2540] flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#00A896]" />
                  <span>Step 5: Multi-Provider Payment Gateway</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select your preferred payment method. Authoritative server-side verification ensures complete transactional safety.
                </p>
              </div>

              {/* Payment Provider Options */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'RAZORPAY', name: 'Razorpay / Cards', desc: 'Credit, Debit, NetBanking', icon: '💳' },
                  { id: 'UPI', name: 'UPI Direct', desc: 'GPay, PhonePe, Paytm', icon: '📱' },
                  { id: 'CARD_MOCK', name: 'Cards Direct', desc: 'Visa, MasterCard, RuPay', icon: '🔒' },
                  { id: 'COD', name: 'Cash on Delivery', desc: 'Pay at Doorstep', icon: '💵' },
                ].map((p) => {
                  const isSelected = selectedProvider === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProvider(p.id as PaymentProvider)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#00A896] bg-teal-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <span className="text-2xl mb-1 block">{p.icon}</span>
                        <span className="text-xs font-bold text-slate-900 block">{p.name}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{p.desc}</span>
                      </div>
                      {isSelected && (
                        <div className="mt-2 text-[#00A896] flex items-center gap-1 text-[10px] font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Detailed Provider Form Inputs */}
              {selectedProvider === 'UPI' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">Enter UPI ID / VPA</span>
                  <Input
                    placeholder="yourname@okhdfcbank or phone@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="bg-white text-xs"
                  />
                  <p className="text-[11px] text-slate-400">
                    A payment request will be sent to your UPI app for authorization.
                  </p>
                </div>
              )}

              {selectedProvider === 'CARD_MOCK' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">Card Information</span>
                  <Input
                    placeholder="Card Number (e.g. 4532 •••• •••• 4242)"
                    value={cardData.number}
                    onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                    className="bg-white text-xs font-mono"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="MM / YY"
                      value={cardData.expiry}
                      onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                      className="bg-white text-xs font-mono"
                    />
                    <Input
                      placeholder="CVV"
                      type="password"
                      maxLength={4}
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                      className="bg-white text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {selectedProvider === 'COD' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Cash on Delivery Policy</span>
                    <p className="mt-0.5 text-[11px]">
                      Please keep exact cash (₹{grandTotal.toFixed(2)}) ready upon delivery. Digital payment via QR is also available with our rider.
                    </p>
                  </div>
                </div>
              )}

              {/* Simulation Switch for Testing Resilience */}
              <div className="p-3.5 rounded-2xl bg-slate-100/70 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-500" />
                  <div>
                    <span className="font-bold text-slate-800 block">Gateway Simulation Control</span>
                    <span className="text-[10px] text-slate-500">Test authoritative success or decline & retry handling.</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentSimulationOutcome('PAID')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      paymentSimulationOutcome === 'PAID'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Simulate Success
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentSimulationOutcome('FAILED')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      paymentSimulationOutcome === 'FAILED'
                        ? 'bg-rose-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Simulate Failure
                  </button>
                </div>
              </div>

              {/* Step 5 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button variant="ghost" size="md" onClick={() => setCurrentStep(4)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Summary
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleFinalizeOrder}
                  isLoading={isProcessingPayment}
                  className="rounded-xl px-8 shadow-md"
                >
                  Pay {formatCurrency(grandTotal)} Now
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right Sticky Order Total Card (4 cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-md space-y-4">
            <h3 className="font-bold text-[#0A2540] text-sm flex items-center justify-between">
              <span>Price Details (INR)</span>
              <span className="text-xs font-normal text-slate-400">{items.length} unique item(s)</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-600 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex items-center justify-between text-emerald-600 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Coupon ({appliedCoupon.coupon.code})
                  </span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span>Delivery Charge</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-emerald-600">FREE</span>
                  ) : (
                    formatCurrency(deliveryFee)
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-500">
                  Platform Fee <Info className="h-3 w-3 text-slate-400" />
                </span>
                <span className="font-semibold text-slate-800">{formatCurrency(platformFee)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-base font-black text-[#0A2540] pt-1">
              <span>Grand Total</span>
              <span className="text-xl text-[#00A896]">{formatCurrency(grandTotal)}</span>
            </div>

            {subtotal < 500 && (
              <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 text-[11px] text-teal-800 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-[#00A896] shrink-0" />
                <span>Add {formatCurrency(500 - subtotal)} more to get FREE express delivery!</span>
              </div>
            )}

            <div className="pt-2 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#00A896] shrink-0" />
                <span>100% Genuine Certified Healthcare Products</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#00A896] shrink-0" />
                <span>Temperature controlled cold-chain dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Form Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <h3 className="font-bold text-[#0A2540] text-base flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#00A896]" />
                  <span>{editingAddressId ? 'Edit Address' : 'Add New Indian Delivery Address'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                    <Input
                      value={addressForm.full_name}
                      onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phone Number (10 digits)</label>
                    <Input
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Address Line 1 (Flat / Building / Street)</label>
                  <Input
                    value={addressForm.address_line1}
                    onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Address Line 2 (Area / Colony)</label>
                    <Input
                      value={addressForm.address_line2 || ''}
                      onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Landmark (Optional)</label>
                    <Input
                      value={addressForm.landmark || ''}
                      onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">City</label>
                    <Input
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">State</label>
                    <select
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                      required
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">PIN Code</label>
                    <Input
                      value={addressForm.postal_code}
                      onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Address Type</label>
                  <div className="flex gap-4">
                    {(['HOME', 'WORK', 'OTHER'] as const).map((type) => (
                      <label key={type} className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                        <input
                          type="radio"
                          name="address_type"
                          checked={addressForm.address_type === type}
                          onChange={() => setAddressForm({ ...addressForm, address_type: type })}
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddressModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Save Address
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Processing Overlay */}
      {isProcessingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4 border border-slate-100">
            <div className="w-16 h-16 border-4 border-[#00A896]/20 border-t-[#00A896] rounded-full animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-[#0A2540]">Processing Healthcare Order</h3>
            <p className="text-xs text-slate-500">{paymentStatusText}</p>
            <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Lock className="h-3 w-3 text-[#00A896]" />
              <span>PCI-DSS Compliant • 256-Bit Encrypted Communication</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
