import React, { useState, useEffect } from 'react';
import { Store, Phone, MapPin, Globe, Image as ImageIcon, Check, AlertCircle, Save, Upload, Copy, ExternalLink, Download, QrCode as QrIcon, Sparkles, Radio, ChevronDown, ChevronUp, HelpCircle, ShieldCheck, Server, Palette, Type, Sun, Moon, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ImagePicker } from './ImagePicker';
import { uploadToCloudinaryApi } from '../services/api';
import { openGooglePicker, PickedDriveFile } from '../firebase/googlePicker';

export const RestaurantSettings: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    restaurant_name: user?.restaurant_name || '',
    owner_name: user?.owner_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    logo_url: user?.logo_url || '',
    cover_url: user?.cover_url || '',
    slug: user?.slug || '',
    primary_color: user?.primary_color || '#f43f5e',
    secondary_color: user?.secondary_color || '#fbbf24',
    theme_mode: user?.theme_mode || 'light',
    font_family: user?.font_family || 'Playfair Display',
  });

  const [pickerType, setPickerType] = useState<'cover' | 'logo' | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<'logo' | 'cover' | null>(null);

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loadingQr, setLoadingQr] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [deploySuccess, setDeploySuccess] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        restaurant_name: user.restaurant_name || prev.restaurant_name,
        owner_name: user.owner_name || prev.owner_name,
        phone: user.phone || prev.phone,
        address: user.address || prev.address,
        logo_url: user.logo_url || prev.logo_url,
        cover_url: user.cover_url || prev.cover_url,
        slug: user.slug || prev.slug,
        primary_color: user.primary_color || prev.primary_color,
        secondary_color: user.secondary_color || prev.secondary_color,
        theme_mode: user.theme_mode || prev.theme_mode,
        font_family: user.font_family || prev.font_family,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (user?.slug) {
      fetchQrCode(user.slug);
    }
  }, [user?.slug]);

  const fetchQrCode = async (targetSlug: string) => {
    setLoadingQr(true);
    const targetUrl = `${window.location.origin}/menu/${targetSlug}`;
    try {
      const res = await fetch(`/api/qr?url=${encodeURIComponent(targetUrl)}`);
      if (res.ok) {
        const data = await res.json();
        setQrDataUrl(data.qr_data_url);
      }
    } catch (e) {
      console.error('Failed to fetch QR code:', e);
    } finally {
      setLoadingQr(false);
    }
  };

  if (!user) return null;

  const currentSlug = formData.slug || user.slug;
  const primaryMenuUrl = `https://nexarismenu.online/menu/${currentSlug}`;
  const localUrl = `${window.location.origin}/menu/${currentSlug}`;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${currentSlug}-menu-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    setErrorMsg(null);

    try {
      const { url } = await uploadToCloudinaryApi(file);
      if (field === 'logo') setFormData((prev) => ({ ...prev, logo_url: url }));
      if (field === 'cover') setFormData((prev) => ({ ...prev, cover_url: url }));
      setSuccessMsg(`Image uploaded successfully!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Image upload failed.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    setDeploySuccess(false);

    const res = await updateProfile(formData);
    setSubmitting(false);

    if (res.success) {
      setSuccessMsg(`Restaurant profile saved & live menu deployed to ${primaryMenuUrl}`);
      setDeploySuccess(true);
      fetchQrCode(formData.slug);
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(res.error || 'Failed to update restaurant profile.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Store className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>Restaurant Details & Branding</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize how your digital menu appears when scanned by customers.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-sm font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Visual Preview Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
          <div className="relative h-48 bg-slate-900">
            {formData.cover_url ? (
              <img
                src={formData.cover_url}
                alt="Cover Preview"
                className="w-full h-full object-cover opacity-90"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                No Cover Image Set
              </div>
            )}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <label className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{uploadingField === 'cover' ? 'Uploading...' : 'Upload Cover'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'cover')}
                  disabled={uploadingField === 'cover'}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await openGooglePicker((file: PickedDriveFile) => {
                      setFormData((prev) => ({ ...prev, cover_url: file.url }));
                    });
                  } catch (err) {
                    console.error('Drive picker error:', err);
                  }
                }}
                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#0066DA" d="m6 6 14 26 23-32z"/>
                  <path fill="#00AC47" d="m43 0 23 32h-46z"/>
                  <path fill="#EA4335" d="m66 32 21 32h-46z"/>
                  <path fill="#00832D" d="m20 32 14 26h46z"/>
                  <path fill="#2684FC" d="m34 58-14 20h46z"/>
                  <path fill="#FFBA00" d="m20 32 23 46h-23z"/>
                </svg>
                <span>Google Drive</span>
              </button>

              <button
                type="button"
                onClick={() => setPickerType('cover')}
                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
              >
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Presets</span>
              </button>
            </div>

            {/* Logo Overlay */}
            <div className="absolute -bottom-6 left-6 w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 p-1 shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              {formData.logo_url ? (
                <img
                  src={formData.logo_url}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xl">
                  {formData.restaurant_name.charAt(0) || 'R'}
                </div>
              )}
              <button
                type="button"
                onClick={() => setPickerType('logo')}
                className="absolute inset-0 bg-slate-900/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="pt-8 pb-5 px-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {formData.restaurant_name || 'Your Restaurant Name'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formData.address || 'Address not configured'}
              </p>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4 transition-colors">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Restaurant Name *
              </label>
              <input
                type="text"
                required
                value={formData.restaurant_name}
                onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Owner Name *
              </label>
              <input
                type="text"
                required
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Phone Number</span>
              </label>
              <input
                type="text"
                placeholder="+1 (555) 019-2834"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Custom URL Slug *</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                    Live Menu Endpoint
                  </span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-xl text-slate-500 dark:text-slate-400 text-xs font-mono font-semibold">
                    nexarismenu.online/menu/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => {
                      const clean = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                      setFormData({ ...formData, slug: clean });
                    }}
                    placeholder="my-restaurant"
                    className="flex-1 px-3 py-2.5 rounded-r-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>New URL will deploy automatically upon saving</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                    {formData.slug ? `https://nexarismenu.online/menu/${formData.slug}` : 'Enter a unique slug'}
                  </span>
                </div>
              </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Full Address</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 742 Evergreen Terrace, Springfield"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Logo Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await openGooglePicker((file: PickedDriveFile) => {
                        setFormData((prev) => ({ ...prev, logo_url: file.url }));
                      });
                    } catch (err) {
                      console.error('Drive picker error:', err);
                    }
                  }}
                  className="px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/80 text-xs font-semibold transition flex items-center gap-1.5"
                  title="Select from Google Drive"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#0066DA" d="m6 6 14 26 23-32z"/>
                    <path fill="#00AC47" d="m43 0 23 32h-46z"/>
                    <path fill="#EA4335" d="m66 32 21 32h-46z"/>
                    <path fill="#00832D" d="m20 32 14 26h46z"/>
                    <path fill="#2684FC" d="m34 58-14 20h46z"/>
                    <path fill="#FFBA00" d="m20 32 23 46h-23z"/>
                  </svg>
                  <span>Drive</span>
                </button>
                <label className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logo')}
                    disabled={uploadingField === 'logo'}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Cover Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.cover_url}
                  onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await openGooglePicker((file: PickedDriveFile) => {
                        setFormData((prev) => ({ ...prev, cover_url: file.url }));
                      });
                    } catch (err) {
                      console.error('Drive picker error:', err);
                    }
                  }}
                  className="px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/80 text-xs font-semibold transition flex items-center gap-1.5"
                  title="Select from Google Drive"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#0066DA" d="m6 6 14 26 23-32z"/>
                    <path fill="#00AC47" d="m43 0 23 32h-46z"/>
                    <path fill="#EA4335" d="m66 32 21 32h-46z"/>
                    <path fill="#00832D" d="m20 32 14 26h46z"/>
                    <path fill="#2684FC" d="m34 58-14 20h46z"/>
                    <path fill="#FFBA00" d="m20 32 23 46h-23z"/>
                  </svg>
                  <span>Drive</span>
                </button>
                <label className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Custom Theme & Branding Section */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 mt-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Public Menu Theme & Custom Branding</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Give your restaurant unique freedom! Select a luxury preset palette or fine-tune exact primary and secondary colors, select stunning typography fonts, and control Light or Dark themes.
              </p>
            </div>

            {/* Presets Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Quick Preset Themes
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {[
                  { name: 'Rose Garden (Default)', primary: '#f43f5e', secondary: '#fbbf24', font: 'Playfair Display', mode: 'light', desc: 'Classic vibrant rose' },
                  { name: 'Cafe Brown', primary: '#7c2d12', secondary: '#eab308', font: 'Poppins', mode: 'light', desc: 'Aromatic coffee shop' },
                  { name: 'Burgundy Fine', primary: '#881337', secondary: '#f59e0b', font: 'Lora', mode: 'light', desc: 'Elegant French dining' },
                  { name: 'Royal Gold', primary: '#1e3a8a', secondary: '#ca8a04', font: 'Playfair Display', mode: 'light', desc: 'Sovereign blue & bronze' },
                  { name: 'Emerald Mint', primary: '#047857', secondary: '#eab308', font: 'Poppins', mode: 'light', desc: 'Fresh vegetarian greens' },
                  { name: 'Tuscan Red', primary: '#dc2626', secondary: '#16a34a', font: 'Montserrat', mode: 'light', desc: 'Pizzeria & Trattoria' },
                  { name: 'Chaat Orange', primary: '#ea580c', secondary: '#16a34a', font: 'Montserrat', mode: 'light', desc: 'Spicy street food vibes' },
                  { name: 'Noir Luxury', primary: '#1e293b', secondary: '#fbbf24', font: 'Playfair Display', mode: 'dark', desc: 'Premium dark & amber' }
                ].map((preset) => {
                  const isSelected = formData.primary_color === preset.primary &&
                                    formData.secondary_color === preset.secondary &&
                                    formData.font_family === preset.font &&
                                    formData.theme_mode === preset.mode;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          primary_color: preset.primary,
                          secondary_color: preset.secondary,
                          font_family: preset.font,
                          theme_mode: preset.mode as 'light' | 'dark',
                        }));
                      }}
                      className={`text-left p-3 rounded-xl border text-xs transition relative flex flex-col justify-between h-24 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 ring-1 ring-indigo-500'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{preset.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{preset.desc}</div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="w-4 h-4 rounded-full border border-white dark:border-slate-700 shadow-2xs block animate-in" style={{ backgroundColor: preset.primary }} title="Primary" />
                        <span className="w-4 h-4 rounded-full border border-white dark:border-slate-700 shadow-2xs block animate-in" style={{ backgroundColor: preset.secondary }} title="Secondary" />
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 py-0.5 rounded font-mono uppercase truncate max-w-[50px]" title={preset.font}>{preset.font}</span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Brand Colors and Font */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Primary Color Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Primary Theme Color
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs flex-shrink-0">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer scale-125"
                    />
                  </div>
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="#f43f5e"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {['#f43f5e', '#7c2d12', '#881337', '#1e3a8a', '#047857', '#dc2626', '#ea580c', '#db2777', '#1e293b'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, primary_color: c }))}
                      className="w-5 h-5 rounded-md border border-white dark:border-slate-800 shadow-2xs block transition-transform hover:scale-110 cursor-pointer"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Accent/Secondary Color Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Secondary Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs flex-shrink-0">
                    <input
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer scale-125"
                    />
                  </div>
                  <input
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="#fbbf24"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {['#fbbf24', '#eab308', '#ca8a04', '#16a34a', '#10b981', '#2563eb', '#3b82f6', '#ec4899', '#ffffff'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, secondary_color: c }))}
                      className="w-5 h-5 rounded-md border border-white dark:border-slate-800 shadow-2xs block transition-transform hover:scale-110 cursor-pointer"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Typography & Font */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" />
                  <span>Menu Typography Font</span>
                </label>
                <select
                  value={formData.font_family}
                  onChange={(e) => setFormData(prev => ({ ...prev, font_family: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Playfair Display">Playfair Display (Elegant Serif)</option>
                  <option value="Lora">Lora (Warm Editorial Serif)</option>
                  <option value="Poppins">Poppins (Clean Friendly Sans-Serif)</option>
                  <option value="Montserrat">Montserrat (Modern Geometric Sans)</option>
                  <option value="Inter">Inter (Sleek Professional Sans)</option>
                </select>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Theme Mode
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, theme_mode: 'light' }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        formData.theme_mode === 'light'
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Light</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, theme_mode: 'dark' }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        formData.theme_mode === 'dark'
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Miniature Theme Preview */}
            <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Instant Menu Live Preview Card</span>
                </span>
                <span className="text-[10px] font-normal uppercase tracking-wide">Matches selections above</span>
              </div>

              {/* Mock View with live CSS variables */}
              <div
                className="p-5 rounded-xl transition border shadow-xs"
                style={{
                  backgroundColor: formData.theme_mode === 'dark' ? '#0f172a' : '#ffffff',
                  borderColor: formData.theme_mode === 'dark' ? '#1e293b' : '#f1f5f9',
                  fontFamily: `"${formData.font_family}", system-ui, sans-serif`,
                  color: formData.theme_mode === 'dark' ? '#f8fafc' : '#0f172a'
                }}
              >
                {/* Header title */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-base font-black tracking-tight" style={{ color: formData.theme_mode === 'dark' ? '#ffffff' : '#0f172a' }}>
                      {formData.restaurant_name || 'Le Petit Bistro'}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Classic Fine Dining & Delicacies</p>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold font-mono">
                    {formData.restaurant_name ? formData.restaurant_name.charAt(0) : 'L'}
                  </div>
                </div>

                {/* Categories Tab and Bestseller filter */}
                <div className="flex gap-1.5 mt-4">
                  <span
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-2xs border flex items-center gap-1"
                    style={{
                      backgroundColor: formData.primary_color + '18', // 10% opacity hex approximation
                      borderColor: formData.primary_color,
                      color: formData.primary_color
                    }}
                  >
                    <Sparkles className="w-2.5 h-2.5 fill-current animate-pulse" />
                    <span>Today's Special</span>
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-2xs border flex items-center gap-1"
                    style={{
                      backgroundColor: formData.secondary_color + '18',
                      borderColor: formData.secondary_color,
                      color: formData.theme_mode === 'dark' ? '#ffffff' : '#451a03'
                    }}
                  >
                    <span>Bestseller</span>
                  </span>
                </div>

                {/* Mock item card */}
                <div
                  className="mt-4 p-3 rounded-lg border flex items-center gap-3"
                  style={{
                    backgroundColor: formData.theme_mode === 'dark' ? '#1e293b' : '#f8fafc',
                    borderColor: formData.theme_mode === 'dark' ? '#334155' : '#e2e8f0'
                  }}
                >
                  <div className="w-12 h-12 rounded-md bg-slate-300 dark:bg-slate-700 overflow-hidden flex-shrink-0 relative">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-[10px]">Photo</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className="text-xs font-bold truncate">Premium Smoked Salmon Sourdough</h5>
                      <span className="text-xs font-black" style={{ color: formData.primary_color }}>$14.50</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Scottish organic salmon with capers, red onion & cream cheese spread.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting || uploadingField !== null}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save & Deploy Live Menu</span>
            </button>
          </div>
        </div>
      </form>

      {/* Live Menu URL & Deployment Status Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center text-amber-300 shrink-0">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Custom Domain Active</span>
                </span>
                <span className="text-xs text-indigo-200/80">Slug: <strong className="text-white">{currentSlug}</strong></span>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight mt-1">Live Connected Domain</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(primaryMenuUrl)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-xs transition flex items-center gap-1.5 border border-white/10"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied URL!' : 'Copy nexarismenu.online URL'}</span>
            </button>
            <a
              href={localUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Test Live Menu</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="p-3 bg-white rounded-xl shadow-lg">
              {loadingQr ? (
                <div className="w-40 h-40 flex items-center justify-center text-slate-400">
                  <QrIcon className="w-10 h-10 animate-spin" />
                </div>
              ) : (
                <img
                  src={qrDataUrl}
                  alt="Live Restaurant QR Code"
                  className="w-40 h-40 object-contain"
                />
              )}
            </div>
            <p className="text-[11px] text-indigo-200 mt-2 font-medium">Scannable QR Code</p>
          </div>

          <div className="md:col-span-8 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Primary Live Domain (nexarismenu.online):
                </label>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  CONNECTED
                </span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/10 font-mono text-xs sm:text-sm text-emerald-400 select-all break-all flex items-center justify-between gap-2">
                <span>{primaryMenuUrl}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(primaryMenuUrl)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded text-[11px] text-white font-sans shrink-0"
                  >
                    Copy
                  </button>
                  <a
                    href={primaryMenuUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-indigo-600/60 hover:bg-indigo-600 rounded text-[11px] text-white font-sans shrink-0 flex items-center gap-1"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={!qrDataUrl}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/10 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span>Download QR Code PNG</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Modal */}
      {pickerType && (
        <ImagePicker
          isOpen={!!pickerType}
          onClose={() => setPickerType(null)}
          onSelect={(url) => {
            if (pickerType === 'cover') setFormData((prev) => ({ ...prev, cover_url: url }));
            if (pickerType === 'logo') setFormData((prev) => ({ ...prev, logo_url: url }));
          }}
          title={pickerType === 'cover' ? 'Select Cover Photo' : 'Select Logo'}
          type={pickerType}
        />
      )}
    </div>
  );
};
