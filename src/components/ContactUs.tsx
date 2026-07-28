import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Navbar } from './Navbar';
import { NexarisLogo } from './NexarisLogo';
import { Footer } from './Footer';

export const ContactUs: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sending message
    setSubmitted(true);
    setTimeout(() => {
      setName('');
      setEmail('');
      setMessage('');
      setSubmitted(false);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-12 lg:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Have questions about Nexaris or need support? We're here to help you supercharge your restaurant's digital presence.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-10 mb-12">
            {submitted ? (
              <div className="text-center py-12 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Message Sent!</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Thank you for reaching out. Our team will get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="john@restaurant.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Message *
                  </label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 bg-slate-100 dark:bg-slate-900 rounded-2xl">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 dark:text-white">Email</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">support@nexarismenu.online</p>
            </div>
            <div className="p-6 bg-slate-100 dark:bg-slate-900 rounded-2xl">
              <Phone className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 dark:text-white">Phone</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">9824618484</p>
            </div>
            <div className="p-6 bg-slate-100 dark:bg-slate-900 rounded-2xl">
              <MapPin className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 dark:text-white">Location</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Ahmedabad, India</p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};
