import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Banknote,
  Receipt,
} from 'lucide-react';
import { createCashfreeOrder, verifyCashfreeOrder, loadCashfreeSDK } from '../services/cashfreeService';
import { PaymentGatewayTransaction } from '../types';

export interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (transaction: PaymentGatewayTransaction) => void;
  amount: number;
  title: string;
  subtitle?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  restaurantId?: string;
  orderType?: 'subscription' | 'diner_order';
  allowCashOnTable?: boolean;
  itemsSummary?: { name: string; qty: number; price: number }[];
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  amount,
  title,
  subtitle,
  customerName = 'Guest Customer',
  customerEmail = 'customer@example.com',
  customerPhone = '9876543210',
  restaurantId = 'rest_demo',
  orderType = 'diner_order',
  allowCashOnTable = false,
  itemsSummary = [],
}) => {
  // Step flow: INITIATING -> PROCESSING (direct Cashfree opened or simulator ready) -> SUCCESS_DIALOG -> RETRY_DIALOG
  const [step, setStep] = useState<'INITIATING' | 'PROCESSING' | 'SUCCESS_DIALOG' | 'RETRY_DIALOG'>('INITIATING');
  const [cfOrder, setCfOrder] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedTxn, setCompletedTxn] = useState<PaymentGatewayTransaction | null>(null);
  const [copiedTxn, setCopiedTxn] = useState(false);

  // Live gateway states
  const [pollingStatus, setPollingStatus] = useState<boolean>(false);
  const [paymentSessionUrl, setPaymentSessionUrl] = useState<string | null>(null);
  const [pollingIntervalId, setPollingIntervalId] = useState<any>(null);

  const grandTotal = amount;

  useEffect(() => {
    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
    };
  }, [pollingIntervalId]);

  const handleCloseAndStopPolling = () => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
    setPollingStatus(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setCompletedTxn(null);
      initiateDirectCashfree();
    }
  }, [isOpen]);

  const initiateDirectCashfree = async () => {
    setStep('INITIATING');
    setErrorMessage(null);
    setPollingStatus(false);
    setPaymentSessionUrl(null);

    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }

    try {
      // Create Cashfree order session directly on backend
      const orderRes = await createCashfreeOrder({
        amount: grandTotal,
        currency: 'INR',
        customerName,
        customerEmail,
        customerPhone,
        description: title,
        restaurantId,
        orderType: orderType as 'subscription' | 'diner_order',
      });

      setCfOrder(orderRes);

      // Check if sandbox simulation without API keys
      if (orderRes.simulated) {
        setStep('PROCESSING');
        return;
      }

      // Real Cashfree Gateway Integration: Launch SDK Checkout directly
      setStep('PROCESSING');
      const CashfreeSDKInstance = await loadCashfreeSDK(orderRes.sandbox ? 'TEST' : 'PRODUCTION');
      const cashfree = CashfreeSDKInstance({
        mode: orderRes.sandbox ? 'sandbox' : 'production',
      });

      const baseUrlForLink = orderRes.sandbox 
        ? 'https://sandbox.cashfree.com/pg/view/session/'
        : 'https://payments.cashfree.com/pg/view/session/';
      setPaymentSessionUrl(`${baseUrlForLink}${orderRes.payment_session_id}`);

      try {
        const isInIframe = window.self !== window.top;
        await cashfree.checkout({
          paymentSessionId: orderRes.payment_session_id,
          redirectTarget: isInIframe ? '_blank' : '_self',
        });
      } catch (checkoutErr) {
        console.warn('Direct checkout invocation failed or popup blocked:', checkoutErr);
      }

      // Start automatic polling for payment verification
      setPollingStatus(true);
      const intervalId = setInterval(async () => {
        try {
          const verification = await verifyCashfreeOrder(orderRes.order_id, orderRes.cf_order_id);
          if (verification.success && verification.order_status === 'PAID') {
            clearInterval(intervalId);
            setPollingIntervalId(null);
            setPollingStatus(false);

            const txn: PaymentGatewayTransaction = {
              orderId: orderRes.order_id,
              transactionRef: verification.transaction_ref || `CF_TXN_${Date.now()}`,
              amount: grandTotal,
              currency: 'INR',
              status: 'SUCCESS',
              paymentMethod: 'Cashfree Secure Checkout',
              provider: orderRes.sandbox ? 'Cashfree Sandbox PG' : 'Cashfree Live PG',
              customerName,
              customerEmail,
              customerPhone,
              createdAt: new Date().toISOString(),
            };

            setCompletedTxn(txn);
            setStep('SUCCESS_DIALOG');
          } else if (verification.order_status === 'FAILED' || verification.order_status === 'CANCELLED') {
            clearInterval(intervalId);
            setPollingIntervalId(null);
            setPollingStatus(false);
            setErrorMessage('Payment was declined or cancelled by the gateway.');
            setStep('RETRY_DIALOG');
          }
        } catch (pollErr) {
          console.error('Error polling Cashfree verification:', pollErr);
        }
      }, 3000);

      setPollingIntervalId(intervalId);

    } catch (err: any) {
      console.error('Direct Cashfree initiation error:', err);
      setErrorMessage(err.message || 'Failed to initiate direct Cashfree checkout session.');
      setStep('RETRY_DIALOG');
    }
  };

  const handleCancelPayment = (reason?: string) => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
    setPollingStatus(false);
    setErrorMessage(reason || 'Payment was declined by issuing bank or cancelled by user.');
    setStep('RETRY_DIALOG');
  };

  const handlePayCashOnTable = () => {
    const txn: PaymentGatewayTransaction = {
      orderId: `ord_cash_${Date.now()}`,
      transactionRef: `CASH_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      amount: grandTotal,
      currency: 'INR',
      status: 'SUCCESS',
      paymentMethod: 'Cash on Table',
      provider: 'Direct Cash',
      customerName,
      customerEmail,
      customerPhone,
      createdAt: new Date().toISOString(),
    };
    setCompletedTxn(txn);
    setStep('SUCCESS_DIALOG');
  };

  const copyTxnRef = () => {
    if (completedTxn?.transactionRef) {
      navigator.clipboard.writeText(completedTxn.transactionRef);
      setCopiedTxn(true);
      setTimeout(() => setCopiedTxn(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800 uppercase tracking-wider">
                  Cashfree Direct
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Lock className="w-3 h-3 text-emerald-400" /> 256-bit SSL
                </span>
              </div>
              <h3 className="text-base font-black tracking-tight text-white mt-0.5">{title}</h3>
              {subtitle && <p className="text-[11px] text-slate-400 truncate max-w-xs">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={handleCloseAndStopPolling}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-blue-950/40 px-6 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Total Payable Amount
          </span>
          <div className="text-right">
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">₹{grandTotal.toFixed(2)}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">Zero Convenience Fee</span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto">
          {/* STEP 1: INITIATING */}
          {step === 'INITIATING' && (
            <div className="py-12 text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Connecting to Cashfree Gateway...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Opening secure payment session directly. Please hold on for just a moment.
              </p>
            </div>
          )}

          {/* STEP 2: PROCESSING / DIRECT CHECKOUT OPENED */}
          {step === 'PROCESSING' && (
            <div className="py-6 text-center space-y-6 animate-in fade-in duration-200">
              {/* Live / Test Mode with Real Cashfree SDK opened */}
              <div className="space-y-6">
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                    Cashfree Payment Window Opened
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                    We have opened the official Cashfree secure checkout window. Please complete your transaction there. This screen will automatically update once payment is verified.
                  </p>
                </div>

                {paymentSessionUrl && (
                  <div className="pt-2 max-w-xs mx-auto space-y-3">
                    <a
                      href={paymentSessionUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition"
                    >
                      <span>Reopen Cashfree Payment Page</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <p className="text-[10px] text-slate-400">
                      If your browser blocked the popup, click the button above. Do not close this modal while paying.
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleCancelPayment('Payment cancelled or aborted by user.')}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition cursor-pointer"
                  >
                    Cancel Transaction
                  </button>
                </div>
              </div>

              {/* Optional Cash on Table button if diner ordering */}
              {allowCashOnTable && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handlePayCashOnTable}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Or Pay Cash at Table / Counter (₹{grandTotal})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: SUCCESSFUL PAYMENT DIALOG */}
          {step === 'SUCCESS_DIALOG' && completedTxn && (
            <div className="py-6 text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">
                  Payment Verified & Completed
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3">
                  ₹{completedTxn.amount.toFixed(2)} Paid Successfully
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                  Your payment via Cashfree Gateway has been verified. Click continue below to complete your {orderType === 'subscription' ? 'restaurant registration and renewal' : 'order'}.
                </p>
              </div>

              {/* Receipt Summary Box */}
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
                    <span className="text-[10px] text-slate-400 block">Transaction Ref</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-slate-900 dark:text-white">
                      <span className="truncate max-w-[120px]">{completedTxn.transactionRef}</span>
                      <button onClick={copyTxnRef} className="p-0.5 hover:text-emerald-600 cursor-pointer">
                        {copiedTxn ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Payment Method</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{completedTxn.paymentMethod}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Date & Time</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {new Date(completedTxn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Gateway Status</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">APPROVED</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (completedTxn) {
                      onPaymentSuccess(completedTxn);
                    }
                  }}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/20 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2.5"
                >
                  <span>Continue for Registration / Renewal</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: RETRY / FAILURE DIALOG */}
          {step === 'RETRY_DIALOG' && (
            <div className="py-6 text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-rose-500/20">
                <ShieldAlert className="w-12 h-12" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800 uppercase tracking-wider">
                  Payment Unsuccessful
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3">
                  Transaction Declined or Cancelled
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                  {errorMessage || 'Your payment was not completed. In accordance with your security requirements, we did NOT sign up your restaurant or renew the subscription.'}
                </p>
                
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>No account signed up / No subscription activated</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={initiateDirectCashfree}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Payment</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseAndStopPolling}
                  className="py-3.5 px-6 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer shrink-0"
                >
                  Cancel & Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
