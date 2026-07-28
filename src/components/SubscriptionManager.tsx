import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SubscriptionInfo, SubscriptionInvoice } from '../types';
import {
  getSubscriptionForRestaurant,
  processAnnualSubscriptionPayment,
  getRestaurantInvoices,
  simulateSubscriptionExpiration,
} from '../firebase/firestoreService';
import {
  createCashfreeOrder,
  verifyCashfreeOrder,
  getCashfreeConfig,
  CashfreeConfig,
} from '../services/cashfreeService';
import { PaymentGatewayModal } from './PaymentGatewayModal';
import { PaymentGatewayTransaction } from '../types';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  CreditCard,
  ShieldCheck,
  Receipt,
  Download,
  QrCode,
  Smartphone,
  ArrowRight,
  Clock,
  Check,
  X,
  Zap,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SubscriptionManager: React.FC = () => {
  const { user, token, refreshUser } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [cashfreeConfig, setCashfreeConfig] = useState<CashfreeConfig | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');
  const [customerPhone, setCustomerPhone] = useState('9876543210');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [lastCashfreeTxn, setLastCashfreeTxn] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<SubscriptionInvoice | null>(null);

  const restaurantId = user?.restaurantId || user?.id || '';

  useEffect(() => {
    if (restaurantId) {
      loadSubscriptionData();
    }
    loadCashfreeInfo();
    if (user?.phone) {
      setCustomerPhone(user.phone);
    }
  }, [restaurantId, user]);

  const loadCashfreeInfo = async () => {
    const config = await getCashfreeConfig();
    setCashfreeConfig(config);
  };

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      const [subData, invData] = await Promise.all([
        getSubscriptionForRestaurant(restaurantId),
        getRestaurantInvoices(restaurantId),
      ]);
      setSubscription(subData);
      setInvoices(invData);
    } catch (e) {
      console.error('Failed to load subscription data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleGatewaySuccess = async (txn: PaymentGatewayTransaction) => {
    try {
      const result = await processAnnualSubscriptionPayment(restaurantId, user?.restaurant_name || 'Restaurant', {
        paymentMethod: txn.paymentMethod,
        transactionId: txn.transactionRef,
      });

      // Sync subscription with Node backend
      try {
        await fetch('/api/restaurant/subscription/renew', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        await refreshUser();
      } catch (syncErr) {
        console.error('Failed to sync subscription renewal with backend:', syncErr);
      }

      setLastCashfreeTxn(txn.transactionRef);
      setSubscription(result.subscription);
      setInvoices((prev) => [result.invoice, ...prev]);
      setPaymentSuccess(true);
    } catch (err: any) {
      console.error('Subscription record error:', err);
      alert(err.message || 'Failed to activate subscription after payment.');
    }
  };

  const handleSimulateExpire = async () => {
    setIsSimulating(true);
    try {
      // 1. Update Firestore subscription status to expired
      await simulateSubscriptionExpiration(restaurantId);
      
      // 2. Update Node backend subscription status to expired
      const response = await fetch('/api/restaurant/subscription/expire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Backend failed to set subscription as expired');
      }

      await loadSubscriptionData();
      await refreshUser();
      alert('Subscription set to EXPIRED successfully! Your public slug menu is now disabled. Try visiting it to test, then pay ₹299 to reactivate!');
    } catch (err: any) {
      console.error('Simulation error:', err);
      alert('Failed to simulate subscription expiration: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };


  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  // Source of truth for SQL-backed subscription is the user context
  const currentStatus = user?.subscription_status || subscription?.status || 'trial';
  const isSubActive = currentStatus === 'active' || currentStatus === 'trial';
  const isTrial = currentStatus === 'trial';

  const expiresAtStr = user?.subscription_expires_at || subscription?.endDate;
  const endDate = expiresAtStr ? new Date(expiresAtStr) : new Date();
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Flat Annual Pass</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Annual Pro Digital Menu Subscription
            </h1>
            <p className="text-blue-200 text-sm max-w-xl">
              Enjoy unlimited menu items, instant QR code generation, and Google Drive image picking for a flat <span className="font-bold text-white">₹299 / year</span>.
            </p>
          </div>

          <div className="shrink-0 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Plan Price</span>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              ₹299<span className="text-sm font-normal text-blue-200">/year</span>
            </div>
            <span className="text-[11px] text-emerald-300 font-semibold mt-1">Flat Annual Rate • No Commission</span>
          </div>
        </div>
      </div>

      {/* Current Active Plan Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                <span>Subscription Status</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your annual membership and renewal settings
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                isTrial
                  ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : isSubActive
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isTrial ? 'bg-blue-500 animate-pulse' : isSubActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isTrial ? 'Free Trial Active' : isSubActive ? 'Active Pro Member' : 'Action Required'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>{isTrial ? 'Trial Expiry Date' : 'Renewal Date'}</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${isTrial ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{daysRemaining} days remaining in {isTrial ? 'trial' : 'current'} period</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                <CreditCard className="w-4 h-4 text-blue-500" />
                <span>Annual Fee</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                ₹299 / year
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                Auto-renews annually • Cancel anytime
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-6 py-3 rounded-2xl font-bold text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-md transition flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{isTrial ? 'Upgrade to Annual Pro Plan (₹299)' : isSubActive ? 'Extend / Renew Annual Pass (₹299)' : 'Activate Subscription (₹299)'}</span>
            </button>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Includes 100% features with zero add-on costs</span>
            </span>
          </div>
        </div>

        {/* Benefits Checklist */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>₹299 Annual Pass Benefits</span>
          </h3>

          <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            {[
              'Unlimited Menu Items & Categories',
              'High-Res Instant QR Code Generator',
              'Direct Google Drive Image Picker',
              'Custom Logo & Cover Photo Branding',
              'Real-Time Customer Menu Updates',
              'Zero Commission on Customer Scans',
              '24/7 Dedicated Support & Fast Uptime',
            ].map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600 dark:text-sky-400" />
              <span>Billing & Invoices</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Download tax receipts and view subscription transaction history
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-400 font-semibold tracking-wider">
                <th className="py-3 px-4">Invoice ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    {inv.id}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                    {new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-900 dark:text-white">
                    {inv.planName}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-bold text-slate-900 dark:text-white">
                    ₹{inv.amount}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Paid
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition inline-flex items-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>



      {/* Reusable Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handleGatewaySuccess}
        amount={299}
        title="Nexaris Pro Annual Subscription"
        subtitle="Flat ₹299 / Year • Commission-Free Digital Menu Platform"
        customerName={user?.owner_name || user?.restaurant_name || 'Restaurant Owner'}
        customerEmail={user?.email || 'owner@restaurant.com'}
        customerPhone={customerPhone || '9876543210'}
        restaurantId={restaurantId}
        orderType="subscription"
        itemsSummary={[{ name: 'Annual Pro Pass (365 Days)', qty: 1, price: 299 }]}
      />


      {/* Invoice Receipt Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tax Invoice & Receipt</h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="font-semibold">Invoice Number:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedInvoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Restaurant:</span>
                <span>{selectedInvoice.restaurantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Date Paid:</span>
                <span>{new Date(selectedInvoice.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Plan Description:</span>
                <span>{selectedInvoice.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Transaction Reference:</span>
                <span className="font-mono">{selectedInvoice.transactionRef}</span>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50 flex justify-between items-center text-sm font-bold text-blue-900 dark:text-blue-200">
                <span>Total Paid:</span>
                <span className="text-lg text-blue-600 dark:text-sky-400">₹{selectedInvoice.amount}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
