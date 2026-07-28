import React from 'react';
import { FileText, CheckCircle, AlertTriangle, Scale, CreditCard, HelpCircle, Mail, ArrowLeft } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const TermsAndConditions: React.FC = () => {
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
              <Scale className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900">
              Legal Agreement
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last Updated: <span className="font-semibold text-slate-700 dark:text-slate-300">July 2026</span> • Effective immediately upon registration or platform usage.
          </p>
          
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Welcome to <strong className="text-slate-900 dark:text-white">Nexaris</strong> (<a href="https://nexarismenu.online" className="text-blue-600 dark:text-sky-400 underline">nexarismenu.online</a>). These Terms and Conditions constitute a binding legal agreement between you ("Merchant", "Restaurant Partner", or "User") and Nexaris governing your access to and use of our digital menu creation platform, QR ordering systems, and payment gateway integrations.
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          
          {/* Section 1 */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 font-bold text-sm">
                1
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Acceptance of Terms &amp; Platform Scope
              </h2>
            </div>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1 sm:pl-12">
              <p>
                By creating a Nexaris account, subscribing to our annual Pro plans, or generating QR menus for your hospitality establishment, you expressly agree to abide by these Terms. If you do not agree to all provisions, you must discontinue platform access immediately.
              </p>
              <p>
                Nexaris provides a Software-as-a-Service (SaaS) suite enabling restaurants, cafes, food courts, and hotels to build digital menus, generate scannable QR codes, manage inventory statuses, and facilitate contactless ordering.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 font-bold text-sm">
                2
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Subscription Billing &amp; Payment Gateway Terms
              </h2>
            </div>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1 sm:pl-12">
              <p>
                Nexaris offers both free trial tiers and full-featured annual subscriptions:
              </p>
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-2.5">
                  <CreditCard className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white block">Annual Pro Plan Pricing</strong>
                    <span className="text-xs text-slate-500 dark:text-slate-400">The standard Nexaris Pro subscription is priced at ₹299 per year per restaurant location, providing unlimited menu categories, items, QR code downloads, and real-time out-of-stock toggles.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white block">Payment Processing via Cashfree</strong>
                    <span className="text-xs text-slate-500 dark:text-slate-400">All payments are securely processed via verified banking gateways including <strong className="text-slate-700 dark:text-slate-200">Cashfree Payments</strong>. Upon successful webhook verification, your subscription status is automatically activated or renewed.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white block">Refund &amp; Cancellation Policy</strong>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Annual subscription fees are earned upon activation and are generally non-refundable once the service is provisioned, except in instances of documented technical non-delivery or where mandated by applicable statutory consumer protection laws.</span>
                  </div>
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
                Merchant Responsibilities &amp; Content Guidelines
              </h2>
            </div>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1 sm:pl-12">
              <p>As a participating restaurant partner, you acknowledge and agree that:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-slate-800 dark:text-slate-200">Menu Accuracy:</strong> You are strictly and solely responsible for maintaining accurate food pricing, ingredient lists, dietary designations (Veg/Non-Veg/Vegan), and allergen warnings on your Nexaris menu.</li>
                <li><strong className="text-slate-800 dark:text-slate-200">Intellectual Property Compliance:</strong> You must own or hold valid licenses for all logos, food photography, and branding assets uploaded to your menu. You agree not to upload infringing or copyrighted media.</li>
                <li><strong className="text-slate-800 dark:text-slate-200">Lawful Hospitality Services:</strong> You will use the platform exclusively for lawful food and beverage service, adhering to all municipal health, safety, and tax regulations in your operating jurisdiction.</li>
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
                Diner QR Ordering &amp; Transaction Facilitation
              </h2>
            </div>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1 sm:pl-12">
              <p>
                When a restaurant guest scans a Nexaris QR code and submits a food order or payment, the commercial agreement is directly and exclusively between the dining customer and the respective restaurant establishment.
              </p>
              <p>
                Nexaris acts strictly as an intermediary technology software provider. We do not prepare food, employ delivery personnel, or manage kitchen fulfillment. Therefore, Nexaris bears no liability for food quality, preparation delays, dietary reactions, or disputes arising between diners and restaurant management.
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
                Limitation of Liability &amp; Platform Availability
              </h2>
            </div>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1 sm:pl-12">
              <p>
                The Nexaris platform is provided on an <span className="italic font-semibold">"as is"</span> and <span className="italic font-semibold">"as available"</span> basis. While we strive for 99.9% uptime with automated cloud redundancy, we do not warrant that service will be completely uninterrupted by localized internet outages, scheduled maintenance, or third-party banking gateway disruptions.
              </p>
              <p>
                To the maximum extent permitted by applicable law, Nexaris shall not be liable for any indirect, incidental, consequential, special, or exemplary damages, including lost revenue or dining turnover, arising out of or in connection with the use or inability to use the platform.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 font-bold text-sm">
                6
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Governing Law &amp; Dispute Resolution
              </h2>
            </div>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1 sm:pl-12">
              <p>
                These Terms and Conditions shall be governed by, interpreted, and construed in accordance with the laws of India, without regard to conflict of law principles. Any legal action, suit, or proceeding arising out of or relating to these Terms shall be instituted exclusively in the competent courts situated in <strong className="text-slate-900 dark:text-white">Ahmedabad, Gujarat, India</strong>.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Questions regarding our Terms?</h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  If you need clarification on subscription licensing, enterprise multi-branch deployment, or legal agreements, reach out to our legal support desk.
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
                <span>Contact Legal Team</span>
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
