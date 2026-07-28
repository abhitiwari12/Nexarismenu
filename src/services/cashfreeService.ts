export interface CashfreeConfig {
  configured: boolean;
  environment: 'TEST' | 'PRODUCTION' | string;
  app_id: string | null;
  api_version: string;
  currency: string;
  payment_methods: string[];
  sdk_url: string;
}

export interface CashfreeOrderParams {
  amount: number;
  currency?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  restaurantId?: string;
  orderType?: 'subscription' | 'diner_order';
}

export interface CashfreeOrderResponse {
  success: boolean;
  sandbox: boolean;
  simulated?: boolean;
  gateway: 'cashfree' | 'cashfree_sandbox';
  environment: string;
  order_id: string;
  cf_order_id?: string;
  payment_session_id: string;
  order_amount: number;
  order_currency: string;
  order_status: string;
  merchant_name?: string;
  description?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  message?: string;
}

export interface CashfreeVerifyResponse {
  success: boolean;
  order_status: string;
  order_id: string;
  cf_order_id?: string;
  transaction_ref: string;
  amount?: number;
  verified_at: string;
  message?: string;
  error?: string;
}

declare global {
  interface Window {
    Cashfree?: any;
  }
}

// Dynamically load Cashfree Web SDK JS script if needed
export async function loadCashfreeSDK(environment: string = 'TEST'): Promise<any> {
  if (window.Cashfree) {
    return window.Cashfree;
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById('cashfree-js-sdk');
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (window.Cashfree) {
          clearInterval(checkInterval);
          resolve(window.Cashfree);
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.id = 'cashfree-js-sdk';
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => {
      if (window.Cashfree) {
        resolve(window.Cashfree);
      } else {
        reject(new Error('Cashfree JS SDK failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK script'));
    document.body.appendChild(script);
  });
}

// Fetch Cashfree Gateway Status & Config
export async function getCashfreeConfig(): Promise<CashfreeConfig> {
  try {
    const res = await fetch('/api/cashfree/config');
    if (!res.ok) throw new Error('Failed to fetch Cashfree config');
    return await res.json();
  } catch (err) {
    console.warn('Cashfree config load warning:', err);
    return {
      configured: false,
      environment: 'TEST',
      app_id: null,
      api_version: '2023-08-01',
      currency: 'INR',
      payment_methods: [
        'Cashfree UPI / GPay / PhonePe / Paytm',
        'Credit & Debit Cards',
        'NetBanking (50+ Banks)',
        'Cashfree Wallets',
      ],
      sdk_url: 'https://sdk.cashfree.com/js/v3/cashfree.js',
    };
  }
}

// Create Payment Order via Server API
export async function createCashfreeOrder(params: CashfreeOrderParams): Promise<CashfreeOrderResponse> {
  const payload = {
    ...params,
    amount: params.amount,
    order_amount: params.amount,
    customer_name: params.customerName,
    customer_email: params.customerEmail,
    customer_phone: params.customerPhone,
    order_note: params.description,
  };

  const res = await fetch('/api/cashfree/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create Cashfree order');
  }

  return await res.json();
}

// Verify Payment Order Completion
export async function verifyCashfreeOrder(order_id: string, payment_id?: string): Promise<CashfreeVerifyResponse> {
  const res = await fetch('/api/cashfree/verify-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id, payment_id }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    return {
      success: false,
      order_status: 'FAILED',
      order_id,
      transaction_ref: '',
      verified_at: new Date().toISOString(),
      error: errorData.error || 'Cashfree payment verification failed',
    };
  }

  return await res.json();
}
