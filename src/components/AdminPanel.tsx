import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminDashboardStats, AdminRestaurantListItem, AdminRestaurantDetail } from '../types';
import {
  Store,
  FolderTree,
  UtensilsCrossed,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  ShieldAlert,
  ExternalLink,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  MapPin,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Database,
  CreditCard,
  Lock,
  Key,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getStoredToken } from '../services/api';

async function fetchAdmin<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Admin API Error');
  return data;
}

const getAdminDashboardStats = () => fetchAdmin<AdminDashboardStats>('/api/admin/dashboard');
const getAllRestaurantsForAdmin = async () => {
  const res = await fetchAdmin<{restaurants: AdminRestaurantListItem[]}>('/api/admin/restaurants');
  return res.restaurants;
};
const getRestaurantDetailForAdmin = (id: string) => fetchAdmin<AdminRestaurantDetail>(`/api/admin/restaurants/${id}`);
const updateRestaurantStatus = async (id: string, status: string) => {
  await fetchAdmin(`/api/admin/restaurants/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
};
const deleteRestaurantAndData = async (id: string) => {
  await fetchAdmin(`/api/admin/restaurants/${id}`, { method: 'DELETE' });
};

type AdminTab = 'dashboard' | 'restaurants' | 'gateway' | 'account';

interface AdminPanelProps {
  onOpenDbModal?: () => void;
}

export function AdminPanel({ onOpenDbModal }: AdminPanelProps = {}) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [restaurants, setRestaurants] = useState<AdminRestaurantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Selected restaurant for detailed view
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [restaurantDetail, setRestaurantDetail] = useState<AdminRestaurantDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Status toggle confirmation
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Add Restaurant Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addRestName, setAddRestName] = useState('');
  const [addOwnerName, setAddOwnerName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  // Cashfree Payment Gateway State
  const [cashfreeAppId, setCashfreeAppId] = useState('');
  const [cashfreeSecretKey, setCashfreeSecretKey] = useState('');
  const [cashfreeEnv, setCashfreeEnv] = useState<'TEST' | 'PRODUCTION'>('TEST');
  const [cashfreeConfigured, setCashfreeConfigured] = useState(false);
  const [cashfreeSaving, setCashfreeSaving] = useState(false);
  const [cashfreeMsg, setCashfreeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchCashfreeConfig();
  }, []);

  const fetchCashfreeConfig = async () => {
    try {
      const res = await fetchAdmin<{ appId: string; secretKey: string; environment: 'TEST' | 'PRODUCTION'; configured: boolean }>('/api/cashfree/admin-config');
      setCashfreeAppId(res.appId || '');
      setCashfreeSecretKey(res.secretKey || '');
      setCashfreeEnv(res.environment || 'TEST');
      setCashfreeConfigured(res.configured);
    } catch (err) {
      console.error('Failed to load Cashfree admin config:', err);
    }
  };

  const handleSaveCashfree = async (e: React.FormEvent) => {
    e.preventDefault();
    setCashfreeSaving(true);
    setCashfreeMsg(null);
    try {
      const res = await fetchAdmin<{ success: boolean; message: string; configured: boolean; environment: 'TEST' | 'PRODUCTION' }>('/api/cashfree/admin-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: cashfreeAppId,
          secretKey: cashfreeSecretKey,
          environment: cashfreeEnv,
        })
      });
      setCashfreeConfigured(res.configured);
      setCashfreeMsg({ type: 'success', text: res.message });
      fetchCashfreeConfig();
    } catch (err: any) {
      setCashfreeMsg({ type: 'error', text: err.message || 'Failed to update Cashfree credentials' });
    } finally {
      setCashfreeSaving(false);
    }
  };

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);

    try {
      await fetchAdmin('/api/admin/create-restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_name: addOwnerName,
          email: addEmail,
          password: addPassword,
          restaurant_name: addRestName,
        }),
      });

      setShowAddModal(false);
      setAddRestName('');
      setAddOwnerName('');
      setAddEmail('');
      setAddPassword('');
      fetchDashboardData();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, restList] = await Promise.all([
        getAdminDashboardStats(),
        getAllRestaurantsForAdmin(),
      ]);
      setStats(statsData);
      setRestaurants(restList);
    } catch (e) {
      console.error('Failed to fetch admin dashboard:', e);
    } fontFinally: {
      setLoading(false);
    }
  };

  const handleViewRestaurant = async (id: string) => {
    setSelectedRestaurantId(id);
    setDetailLoading(true);
    try {
      const detail = await getRestaurantDetailForAdmin(id);
      setRestaurantDetail(detail);
    } catch (e) {
      console.error('Error fetching restaurant detail:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setActionLoadingId(id);
    try {
      await updateRestaurantStatus(id, newStatus);

      // Update local list
      setRestaurants((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus as any } : r))
      );
      if (restaurantDetail && restaurantDetail.restaurant.id === id) {
        setRestaurantDetail((prev) =>
          prev ? { ...prev, restaurant: { ...prev.restaurant, status: newStatus as any } } : null
        );
      }
    } catch (e) {
      console.error('Error toggling status:', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteRestaurant = async (id: string) => {
    setActionLoadingId(id);
    try {
      await deleteRestaurantAndData(id);

      setRestaurants((prev) => prev.filter((r) => r.id !== id));
      if (selectedRestaurantId === id) {
        setSelectedRestaurantId(null);
        setRestaurantDetail(null);
      }
      setDeleteConfirmId(null);
      fetchDashboardData();
    } catch (e) {
      console.error('Error deleting restaurant:', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      r.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const copyMenuLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-5 shrink-0">
        <div>
          {/* Platform Admin Brand */}
          <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
                Nexaris Admin
              </h1>
              <p className="text-xs text-indigo-400 font-medium">Platform Management</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('restaurants')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'restaurants'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Restaurants</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-semibold border border-slate-700">
                {restaurants.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('gateway')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'gateway'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Payment Gateway</span>
              <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase border ${
                cashfreeConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {cashfreeConfigured ? cashfreeEnv : 'Pending'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'account'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin Account</span>
            </button>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="pt-6 border-t border-slate-800 mt-6">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-white truncate">{user?.owner_name || 'Admin Owner'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Logout"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Platform Owner Mode (Cloud Firestore)
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
              {activeTab === 'dashboard' && 'System Analytics & Overview'}
              {activeTab === 'restaurants' && 'Registered Restaurants Directory'}
              {activeTab === 'account' && 'Platform Owner Profile'}
            </h2>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Total Restaurants
                  </span>
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Store className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extrabold text-white">
                    {stats?.total_restaurants ?? restaurants.length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Active platform client accounts</p>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Total Categories
                  </span>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <FolderTree className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extrabold text-white">
                    {stats?.total_categories ?? 0}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Menu sections across all menus</p>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Total Menu Items
                  </span>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extrabold text-white">
                    {stats?.total_menu_items ?? 0}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Active items published on QR menus</p>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    New Today
                  </span>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <UserPlus className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extrabold text-white">
                    {stats?.new_restaurants_today ?? 0}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Registrations in last 24h</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-950/80 via-slate-800 to-indigo-900/60 border border-indigo-500/30 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider">
                    Annual Pass Revenue
                  </span>
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extrabold text-emerald-400">
                    ₹{(restaurants.length * 299).toLocaleString()}
                  </p>
                  <p className="text-xs text-indigo-200 mt-1">Flat ₹299 / restaurant / year</p>
                </div>
              </div>
            </div>

            {/* Quick Overview Table */}
            <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Recently Registered Restaurants</h3>
                  <p className="text-xs text-slate-400">Quick status and moderation controls</p>
                </div>
                <button
                  onClick={() => setActiveTab('restaurants')}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  View All Directory <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Restaurant</th>
                      <th className="py-3 px-4">Owner</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Items / Cats</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {restaurants.slice(0, 5).map((rest) => (
                      <tr key={rest.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-900/40 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0 overflow-hidden">
                              {rest.logo_url ? (
                                <img src={rest.logo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                rest.restaurant_name.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{rest.restaurant_name}</p>
                              <p className="text-xs text-slate-400">/{rest.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-200">{rest.owner_name}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              rest.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {rest.status === 'active' ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" /> Suspended
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {rest.items_count} items ({rest.categories_count} cats)
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setActiveTab('restaurants');
                              handleViewRestaurant(rest.id);
                            }}
                            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                            title="View Restaurant Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* RESTAURANTS TAB */}
        {activeTab === 'restaurants' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 flex-1">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search restaurant, owner, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-400 font-medium">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-slate-900/80 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="suspended">Suspended Only</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="shrink-0 flex items-center gap-2 px-4 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Restaurant</span>
              </button>
            </div>

            {/* Restaurants Directory Table */}
            <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-6 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Restaurant</th>
                      <th className="py-3 px-4">Owner Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Plan</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Registered</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {filteredRestaurants.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No restaurants matched your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRestaurants.map((rest) => (
                        <tr key={rest.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0 overflow-hidden">
                                {rest.logo_url ? (
                                  <img src={rest.logo_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  rest.restaurant_name.charAt(0)
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-white text-sm">{rest.restaurant_name}</p>
                                <p className="text-xs text-slate-400 font-mono">/{rest.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-200">{rest.owner_name}</td>
                          <td className="py-4 px-4 text-slate-300 text-xs font-mono">{rest.email}</td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                              Annual Pro (₹299/yr)
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                rest.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {rest.status === 'active' ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-400">
                            {rest.created_at ? new Date(rest.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* View Action */}
                              <button
                                onClick={() => handleViewRestaurant(rest.id)}
                                className="p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                                title="View Detailed Profile"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Suspend / Activate Toggle Action */}
                              <button
                                onClick={() => handleToggleStatus(rest.id, rest.status)}
                                disabled={actionLoadingId === rest.id}
                                className={`p-2 rounded-lg font-medium text-xs transition-colors ${
                                  rest.status === 'active'
                                    ? 'bg-amber-500/20 hover:bg-amber-600 text-amber-300 hover:text-white'
                                    : 'bg-emerald-500/20 hover:bg-emerald-600 text-emerald-300 hover:text-white'
                                }`}
                                title={rest.status === 'active' ? 'Suspend Restaurant' : 'Activate Restaurant'}
                              >
                                {rest.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>

                              {/* Delete Action */}
                              <button
                                onClick={() => setDeleteConfirmId(rest.id)}
                                className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors"
                                title="Delete Restaurant"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-6 sm:p-8 max-w-2xl space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-700 pb-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-600/30">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{user?.owner_name || 'Platform Administrator'}</h3>
                <p className="text-sm text-indigo-400 font-semibold">{user?.restaurant_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                System Security & Authorization Status
              </h4>

              <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">User Role:</span>
                  <span className="font-bold text-indigo-400 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                    PLATFORM OWNER (ADMIN)
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Firebase Storage & Auth:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Active & Operational
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Firebase Firestore Rules:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Deployed & Enforced
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="w-4 h-4" /> Admin Confidentiality Notice
                </p>
                <p>
                  As the platform owner, you have full authority to suspend or remove restaurants from Nexaris.
                  Data operations sync directly with Google Cloud Firestore in real time.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT GATEWAY CONFIG TAB */}
        {activeTab === 'gateway' && (
          <div className="space-y-6 max-w-3xl">
            <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-start justify-between border-b border-slate-700 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white">Cashfree Payments Integration</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        cashfreeConfigured
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {cashfreeConfigured ? 'Configured & Active' : 'Not Configured'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Manage official Cashfree App ID, Secret Key, and Environment mode for processing live or sandbox payments.
                    </p>
                  </div>
                </div>
              </div>

              {cashfreeMsg && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  cashfreeMsg.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/80 border border-rose-800 text-rose-300'
                }`}>
                  {cashfreeMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />}
                  <span>{cashfreeMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveCashfree} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cashfree App ID *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1042784xxxxxxxxx or TEST1042784..."
                    value={cashfreeAppId}
                    onChange={(e) => setCashfreeAppId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Found in your Cashfree Merchant Dashboard under <strong>Payment Gateway &gt; Developers &gt; API Keys</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cashfree Secret Key *</span>
                  </label>
                  <input
                    type="password"
                    placeholder={cashfreeSecretKey ? "•••••••••••• (Leave unchanged unless updating)" : "Enter Cashfree Secret Key"}
                    value={cashfreeSecretKey}
                    onChange={(e) => setCashfreeSecretKey(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Keep this secret key safe. Never expose raw secret keys in client-side code.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Gateway Environment Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCashfreeEnv('TEST')}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                        cashfreeEnv === 'TEST'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold text-indigo-400 uppercase">TEST / SANDBOX</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Uses Cashfree Test PG (Supports test UPI/Cards)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCashfreeEnv('PRODUCTION')}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                        cashfreeEnv === 'PRODUCTION'
                          ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold text-emerald-400 uppercase">PRODUCTION / LIVE</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Processes real money via live Cashfree Merchant Account</div>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={cashfreeSaving}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {cashfreeSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>{cashfreeSaving ? 'Saving & Testing...' : 'Save Cashfree Gateway Configuration'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Hosting / Deployment Guide Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Running Outside AI Studio / Hosted Deployments</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                When deploying your application outside AI Studio (e.g., Cloud Run, Vercel, Railway, Render, Docker container, or VPS), you can set these environment variables directly in your host's environment settings or <code>.env</code> file:
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 space-y-1">
                <div>CASHFREE_APP_ID="your_app_id_here"</div>
                <div>CASHFREE_SECRET_KEY="your_secret_key_here"</div>
                <div>CASHFREE_ENVIRONMENT="PRODUCTION" # or "TEST"</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* VIEW RESTAURANT MODAL */}
      <AnimatePresence>
        {selectedRestaurantId && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl p-6 sm:p-8 text-slate-100 shadow-2xl relative my-8"
            >
              <button
                onClick={() => {
                  setSelectedRestaurantId(null);
                  setRestaurantDetail(null);
                }}
                className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>

              {detailLoading || !restaurantDetail ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-sm font-medium text-slate-400">Loading restaurant inspection data...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-950 border border-indigo-500/30 overflow-hidden shrink-0 flex items-center justify-center text-2xl font-bold text-indigo-400">
                      {restaurantDetail.restaurant.logo_url ? (
                        <img src={restaurantDetail.restaurant.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        restaurantDetail.restaurant.restaurant_name.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-extrabold text-white">
                          {restaurantDetail.restaurant.restaurant_name}
                        </h3>
                        <span
                          className={`px-3 py-0.5 rounded-full text-xs font-semibold ${
                            restaurantDetail.restaurant.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {restaurantDetail.restaurant.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        Owner: <span className="text-slate-200 font-medium">{restaurantDetail.restaurant.owner_name}</span> | Slug:{' '}
                        <span className="font-mono text-indigo-400">/{restaurantDetail.restaurant.slug}</span>
                      </p>
                    </div>
                  </div>

                  {/* Grid details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Contact info & QR Code */}
                    <div className="space-y-4 bg-slate-800/60 p-5 rounded-xl border border-slate-700/60">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-400" /> Contact & Location
                      </h4>
                      <div className="text-xs space-y-2 text-slate-300">
                        <p className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> {restaurantDetail.restaurant.email}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {restaurantDetail.restaurant.phone || 'Not provided'}
                        </p>
                        <p className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />{' '}
                          {restaurantDetail.restaurant.address || 'Not provided'}
                        </p>
                      </div>

                      {/* QR Code section */}
                      <div className="pt-4 border-t border-slate-700">
                        <h5 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
                          <QrCode className="w-4 h-4 text-indigo-400" /> Public Menu
                        </h5>
                        <div className="space-y-2">
                          <button
                            onClick={() => copyMenuLink(restaurantDetail.public_menu_url)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
                          >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? 'Copied Link!' : 'Copy Public Menu URL'}</span>
                          </button>
                          <a
                            href={restaurantDetail.public_menu_url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Open Menu Page
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Right: Menu breakdown */}
                    <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/60 space-y-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-400" /> Menu Summary ({restaurantDetail.menu_items.length} items)
                      </h4>
                      <div className="max-h-60 overflow-y-auto pr-1 space-y-2">
                        {restaurantDetail.menu_items.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No menu items created yet.</p>
                        ) : (
                          restaurantDetail.menu_items.map((item) => (
                            <div key={item.id} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/50 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-semibold text-white">{item.name}</p>
                                <p className="text-[11px] text-slate-400">${item.price.toFixed(2)}</p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.is_veg ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                                }`}
                              >
                                {item.is_veg ? 'VEG' : 'NON-VEG'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white">Delete Restaurant Permanently?</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will permanently delete this restaurant account along with all its associated categories and published menu items from Cloud Firestore. This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteRestaurant(deleteConfirmId)}
                  disabled={actionLoadingId === deleteConfirmId}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 transition-colors flex items-center gap-2"
                >
                  {actionLoadingId === deleteConfirmId && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Restaurant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-slate-800 rounded-3xl max-w-md w-full shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 bg-slate-900 border-b border-slate-700 relative">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-white">Add New Restaurant</h2>
              <p className="text-xs text-slate-400 mt-1">Manually create a restaurant without payment</p>
            </div>
            <form onSubmit={handleAddRestaurant} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 rounded-xl bg-red-900/40 border border-red-800 text-red-300 text-xs font-medium">
                  {addError}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  required
                  value={addRestName}
                  onChange={(e) => setAddRestName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Owner Name *
                </label>
                <input
                  type="text"
                  required
                  value={addOwnerName}
                  onChange={(e) => setAddOwnerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={addLoading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition disabled:opacity-50"
                >
                  {addLoading ? 'Creating...' : 'Create Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
