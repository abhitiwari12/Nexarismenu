import React from 'react';
import { Shield, Lock, Eye, FileText, Server, UserCheck, Mail, ArrowLeft } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const PrivacyPolicy: React.FC = () => {
  const navigateHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      <Navbar />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 lg:py-16">
        <div className="mb-8">
          <button
            onClick={navigateHome}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-sky-400 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Hero Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-sky-400">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900">
              Legal &amp; Privacy
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last Updated: <span className="font-semibold text-slate-700 dark:text-slate-300">July 2026</span> • Applicable to all Nexaris merchants, staff, and dining guests.
          </p>
          
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            At <strong className="text-slate-900 dark:text-white">Nexaris</strong> (<a href="https://nexarismenu.online" className="text-blue-600 dark:text-sky-400 underline">nexarismenu.online</a>), we believe that data privacy is foundational to trust in digital hospitality. This Privacy Policy outlines how we collect, use, safeguard, and disclose information when restaurant partners ("Merchants") use our QR menu generation and management system, and when restaurant guests ("Customers") browse menus or place digital orders.
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">
          
          {/* Section 1 */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 font-bold text-sm">
                1
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Information We Collect
              </h2>
            </div>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1 sm:pl-12">
              <p>
                We collect different categories of information depending on whether you are a restaurant owner/administrator or a dining guest:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
                <li>
                  <strong className="text-slate-900 dark:text-white">Merchant Account Information:</strong> When you register for Nexaris Pro, we collect your full name, email address, phone number, restaurant business name, physical address, and branding assets (logos, cover photos, food menu item descriptions, and pricing).
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Customer Dining Data:</strong> When diners scan a Nexaris QR code at a participating table, we may collect table numbers, item selections, special preparation notes, and optional contact numbers provided during checkout.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Payment &amp; Billing Data:</strong> Subscription payments and customer food transactions are processed through verified third-party payment gateways (including <strong className="text-slate-900 dark:text-white">Cashfree Payments</strong>). Nexaris receives transaction confirmation IDs, status codes, and timestamps, but <span className="underline decoration-rose-500 font-semibold">we never store raw credit/debit card numbers, UPI PINs, or bank account credentials</span> on our servers.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Technical &amp; Usage Telemetry:</strong> We collect standard web telemetry such as IP addresses, device types, operating systems, browser versions, and interaction logs with our digital menus to optimize loading speeds and diagnose technical anomalies.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 font-bold text-sm">
                2
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                How We Use Your Information
              </h2>
            </div>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1 sm:pl-12">
              <p>We process the collected information for the following specific business purposes:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">Platform Operations</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Rendering real-time digital menus, generating QR codes, and synchronizing menu item stock statuses.</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">Order Execution</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Transmitting customer orders and table numbers directly to restaurant kitchens and manager panels.</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">Payment Verification</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Verifying annual subscription renewals and customer order payments with banking gateway webhooks.</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">Support &amp; Security</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Providing technical assistance, investigating fraud, and enforcing platform integrity rules.</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 font-bold text-sm">
                3
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Sharing &amp; Third-Party Disclosures
              </h2>
            </div>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1 sm:pl-12">
              <p>
                Nexaris does <strong className="text-slate-900 dark:text-white">not</strong> sell, rent, or trade personal data to advertising brokers or marketing agencies. Information is shared only in these strictly limited contexts:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-slate-900 dark:text-white">Restaurant Partners:</strong> When a customer places an order via a QR menu, order items and table identifiers are shared with that specific restaurant to fulfill the service.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Payment Processors:</strong> Necessary payment metadata is transmitted to secure payment providers (e.g., Cashfree Payments) under PCI-DSS compliant standards to authorize transactions.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Cloud Infrastructure Providers:</strong> We utilize secure enterprise cloud hosting (including Google Cloud and Firebase) to host application databases, image assets, and server runtimes.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Legal Requirements:</strong> We may disclose records if legally mandated by a valid court order, government subpoena, or statutory obligation under applicable law.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 font-bold text-sm">
                4
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Data Security &amp; Retention
              </h2>
            </div>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1 sm:pl-12">
              <p>
                We implement robust technical and organizational measures including TLS 1.3 encryption in transit, encrypted data stores at rest, role-based administrative authentication, and continuous automated linter and security verification.
              </p>
              <p>
                Merchant account data and menu configurations are retained for as long as your Nexaris subscription remains active. If an account is terminated or deleted, menu records are securely purged from active servers within 30 days, except where retention is required for legal tax accounting or dispute resolution.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 font-bold text-sm">
                5
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Your Rights &amp; Control
              </h2>
            </div>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1 sm:pl-12">
              <p>
                As a restaurant administrator, you maintain sovereign control over your restaurant catalog. You have the right to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-slate-800 dark:text-slate-200">Access &amp; Edit:</strong> Update your restaurant branding, contact details, and menu items in real time through the Admin Control Panel.</li>
                <li><strong className="text-slate-800 dark:text-slate-200">Export:</strong> Download your QR codes, order histories, and item catalogs at any time.</li>
                <li><strong className="text-slate-800 dark:text-slate-200">Right to Erasure:</strong> Request permanent deletion of your restaurant account and associated data by contacting our privacy team.</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Have questions about our privacy practices?</h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  Our data protection team is available to assist with any privacy inquiries, account deletion requests, or compliance verifications.
                </p>
              </div>
              <button
                onClick={() => {
                  window.history.pushState({}, '', '/contact');
                  window.dispatchEvent(new Event('popstate'));
                }}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 transition shadow-lg shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Contact Privacy Team</span>
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <span>Email: <strong className="text-white">support@nexarismenu.online</strong></span>
              <span>Location: <strong className="text-white">Ahmedabad, India</strong></span>
              <span>Platform: <strong className="text-white">Nexaris</strong></span>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};
