import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  Key,
  Globe,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  X,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Lock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { getDbConfigApi, testDbConnectionApi, connectDbApi, disconnectDbApi, syncDbTablesApi } from '../services/api';

interface PostgresConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const PostgresConfigModal: React.FC<PostgresConfigModalProps> = ({ isOpen, onClose, onConnected }) => {
  const [inputMode, setInputMode] = useState<'url' | 'fields'>('url');

  // Form State
  const [connectionString, setConnectionString] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('railway');
  const [user, setUser] = useState('postgres');
  const [password, setPassword] = useState('');
  const [ssl, setSsl] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Status State
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncingTables, setSyncingTables] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; version?: string; tables_count?: number; error?: string; tables?: string[]; users_count?: number; categories_count?: number; menu_items_count?: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCurrentStatus();
    }
  }, [isOpen]);

  const fetchCurrentStatus = async () => {
    try {
      const status = await getDbConfigApi();
      setDbStatus(status);
      if (status.config) {
        if (status.config.connection_string) {
          setConnectionString(status.config.connection_string);
        }
        if (status.config.host) setHost(status.config.host);
        if (status.config.port) setPort(String(status.config.port));
        if (status.config.database) setDatabase(status.config.database);
        if (status.config.user) setUser(status.config.user);
        if (status.config.ssl !== undefined) setSsl(status.config.ssl);
      }
    } catch (err) {
      console.error('Failed to load DB status:', err);
    }
  };

  if (!isOpen) return null;

  const getPayload = () => {
    if (inputMode === 'url') {
      return { connection_string: connectionString.trim(), ssl };
    }
    return {
      host: host.trim(),
      port: Number(port) || 5432,
      database: database.trim(),
      user: user.trim(),
      password,
      ssl,
    };
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testDbConnectionApi(getPayload());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || 'Connection test failed.' });
    } finally {
      setTesting(false);
    }
  };

  const handleConnectAndSave = async () => {
    setConnecting(true);
    setTestResult(null);
    try {
      const res = await connectDbApi(getPayload());
      if (res.success) {
        setTestResult({ success: true, message: res.message });
        await fetchCurrentStatus();
        if (onConnected) onConnected();
      } else {
        setTestResult({ success: false, error: res.error || res.message });
      }
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || 'Failed to connect.' });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect PostgreSQL and revert to local JSON storage?')) return;
    try {
      await disconnectDbApi();
      await fetchCurrentStatus();
      setTestResult({ success: true, message: 'Reverted to local database.' });
    } catch (err: any) {
      alert('Error disconnecting: ' + err.message);
    }
  };

  const handleSyncTables = async () => {
    setSyncingTables(true);
    setTestResult(null);
    try {
      const res = await syncDbTablesApi();
      if (res.success) {
        setTestResult(res);
        await fetchCurrentStatus();
        if (onConnected) onConnected();
      } else {
        setTestResult({ success: false, error: res.error || res.message });
      }
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || 'Failed to sync tables.' });
    } finally {
      setSyncingTables(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Connect PostgreSQL Database
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your Railway or remote PostgreSQL keys to enable persistent cloud storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Active Status Badge */}
          {dbStatus && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              dbStatus.is_pg_connected
                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full animate-pulse ${dbStatus.is_pg_connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider opacity-75">Active Database Engine</div>
                  <div className="text-sm font-bold flex items-center gap-1.5">
                    {dbStatus.engine}
                  </div>
                  {dbStatus.masked_url && (
                    <div className="text-[11px] opacity-80 font-mono mt-0.5 truncate max-w-md">
                      {dbStatus.masked_url}
                    </div>
                  )}
                </div>
              </div>

              {dbStatus.is_pg_connected && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSyncTables}
                    disabled={syncingTables}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    title="Create required PostgreSQL tables and seed default data"
                  >
                    {syncingTables ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Layers className="w-3.5 h-3.5" />
                    )}
                    <span>Sync Tables</span>
                  </button>

                  <button
                    onClick={handleDisconnect}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/50 transition shadow-sm"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Railway Helper Guide */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-slate-50/80 dark:from-blue-950/20 dark:to-slate-900/50 border border-blue-100 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300">
            <div className="font-semibold text-blue-900 dark:text-sky-300 flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              <span>How to connect Railway PostgreSQL:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1">
              <li>Open your <strong>Railway Project Dashboard</strong> and select your <strong>PostgreSQL</strong> database.</li>
              <li>Go to <strong>Settings</strong> or <strong>Connect</strong> tab and ensure <strong>Public Networking</strong> is enabled.</li>
              <li>Copy the <strong>Public DATABASE_URL</strong> (e.g., <code className="bg-white dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">postgresql://postgres:pass@roundhouse.proxy.rlwy.net:12345/railway</code>). Do not use <code className="text-amber-600 font-mono">postgres.railway.internal</code> as it is private to Railway!</li>
            </ol>
          </div>

          {/* Railway Internal Host Warning Banner */}
          {(connectionString.includes('railway.internal') || host.includes('railway.internal')) && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
              <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-950 dark:text-amber-300">
                  Railway Internal Domain Detected (<code className="font-mono">postgres.railway.internal</code>)
                </div>
                <div className="mt-1 leading-relaxed opacity-90">
                  <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 rounded">postgres.railway.internal</code> is a private hostname only accessible inside Railway's internal network mesh.
                  <br />
                  <strong>Fix:</strong> In Railway, go to <strong>PostgreSQL -&gt; Connect -&gt; Public Networking</strong> (or <strong>Variables -&gt; DATABASE_PUBLIC_URL</strong>) and copy the public proxy address (e.g. <code className="font-mono">roundhouse.proxy.rlwy.net</code>).
                </div>
              </div>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-medium">
            <button
              onClick={() => setInputMode('url')}
              className={`flex-1 py-2.5 rounded-xl text-center transition ${
                inputMode === 'url'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-400 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Option 1: DATABASE_URL (Connection String)
            </button>
            <button
              onClick={() => setInputMode('fields')}
              className={`flex-1 py-2.5 rounded-xl text-center transition ${
                inputMode === 'fields'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-400 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Option 2: Individual Postgres Keys
            </button>
          </div>

          {/* Inputs Section */}
          {inputMode === 'url' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  PostgreSQL Connection URL (DATABASE_URL)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={connectionString}
                    onChange={(e) => setConnectionString(e.target.value)}
                    placeholder="postgresql://postgres:your_password@roundhouse.proxy.rlwy.net:54321/railway"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Supports Railway, Supabase, Neon, Render, or any standard PostgreSQL connection string.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Host / Domain (PGHOST)
                </label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="e.g. roundhouse.proxy.rlwy.net or localhost"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Port (PGPORT)
                </label>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="5432 or custom port"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Database Name (PGDATABASE)
                </label>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  placeholder="railway or nexaris_db"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username (PGUSER)
                </label>
                <input
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="postgres"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password (PGPASSWORD)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 pr-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SSL Checkbox Option */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">Enable SSL Security (sslmode=require)</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Required for Railway, Supabase, Neon & AWS cloud databases</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={ssl}
              onChange={(e) => setSsl(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
          </div>

          {/* Test Connection Output Banner */}
          {testResult && (
            <div className={`p-4 rounded-2xl border ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold">
                    {testResult.success ? 'PostgreSQL Connection Successful!' : 'PostgreSQL Connection Failed'}
                  </div>
                  <div className="text-xs mt-1 opacity-90 leading-relaxed">
                    {testResult.message || testResult.error}
                  </div>
                  {testResult.version && (
                    <div className="text-[11px] font-mono mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60 opacity-80">
                      Server: {testResult.version.split(',')[0]}
                      {testResult.tables_count !== undefined && ` | Existing Tables: ${testResult.tables_count}`}
                    </div>
                  )}

                  {testResult.users_count !== undefined && (
                    <div className="text-[11px] font-mono mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60 opacity-90 flex flex-wrap gap-x-4 gap-y-1">
                      <span>👤 Users: <strong>{testResult.users_count}</strong></span>
                      <span>📂 Categories: <strong>{testResult.categories_count}</strong></span>
                      <span>🍽️ Menu Items: <strong>{testResult.menu_items_count}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleTestConnection}
              disabled={testing || connecting}
              className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Testing Connection...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Test Connection</span>
                </>
              )}
            </button>

            <button
              onClick={handleConnectAndSave}
              disabled={testing || connecting}
              className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-md shadow-blue-200 dark:shadow-blue-950 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {connecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Connecting Database...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 text-white" />
                  <span>Connect & Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
