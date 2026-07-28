import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  Receipt, 
  Copy, 
  Check, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  X, 
  Printer,
  Loader2
} from 'lucide-react';
import { verifyCashfreeOrder, CashfreeVerifyResponse } from '../services/cashfreeService';

interface OrderStatusModalProps {
  orderId: string;
  onClose: () => void;
}

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({ orderId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<CashfreeVerifyResponse | null>(null);
  const [copiedTxn, setCopiedTxn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await verifyCashfreeOrder(orderId);
      setVerification(res);
    } catch (err: any) {
      console.error('Failed to verify order status:', err);
      setErrorMsg(err?.message || 'Could not connect to payment gateway for verification.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [orderId]);

  const copyTxnRef = () => {
    if (!verification?.transaction_ref) return;
    navigator.clipboard.writeText(verification.transaction_ref);
    setCopiedTxn(true);
    setTimeout(() => setCopiedTxn(false), 2000);
  };

  const isPaid = verification?.success || verification?.order_status === 'PAID';
  const isPending = verification?.order_status === 'ACTIVE' || verification?.order_status === 'PENDING';
  const isFailed = !isPaid && !isPending;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
              Gateway Status Screen
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Verifying Payment with Cashfree...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                  Please wait while we confirm your transaction status with the banking gateway.
                </p>
              </div>
            </div>
          ) : errorMsg ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verification Error</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{errorMsg}</p>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={fetchStatus}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : isPaid ? (
            <div className="py-4 text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">
                  Payment Verified & Completed
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3">
                  ₹{verification?.amount ? Number(verification.amount).toFixed(2) : 'Paid'} Successfully
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                  Your payment via Cashfree Gateway has been verified. You have automatically been returned to your application.
                </p>
              </div>

              {/* Receipt Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                  <span className="flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Gateway Receipt</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">SUCCESS</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Order Reference</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white truncate block" title={orderId}>
                      {orderId}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Transaction Ref</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-slate-900 dark:text-white">
                      <span className="truncate max-w-[110px]">{verification?.transaction_ref || 'CF_VERIFIED'}</span>
                      <button onClick={copyTxnRef} className="p-0.5 hover:text-emerald-600 cursor-pointer">
                        {copiedTxn ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Verified At</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {verification?.verified_at ? new Date(verification.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Gateway Status</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">APPROVED</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/20 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Continue to Application</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-4 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          ) : isPending ? (
            <div className="py-6 text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
                <Clock className="w-12 h-12 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 uppercase tracking-wider">
                  Payment In Progress
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3">
                  Awaiting Bank Confirmation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                  Your order status is currently <span className="font-mono font-bold text-amber-600">{verification?.order_status}</span>. We are still waiting for confirmation from Cashfree Gateway.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 text-left flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>If you already completed the payment on Cashfree, click refresh below. If you closed the payment window early, you can return and retry.</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={fetchStatus}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Status</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3.5 px-6 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Return to Menu
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-rose-500/20">
                <ShieldAlert className="w-12 h-12" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800 uppercase tracking-wider">
                  Payment Unsuccessful
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3">
                  Transaction {verification?.order_status || 'Declined'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                  {verification?.error || verification?.message || 'Your payment was declined, aborted, or cancelled on the Cashfree checkout page.'}
                </p>
                
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Order not processed / No charges finalized</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Return to App & Retry</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
