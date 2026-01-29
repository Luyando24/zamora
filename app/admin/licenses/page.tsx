'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Key, Search, Filter, RefreshCw, 
  CheckCircle2, AlertCircle, Copy, ExternalLink,
  ShieldCheck, CreditCard, Calendar, Building2
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface License {
  id: string;
  key: string;
  plan: string;
  status: 'unused' | 'used' | 'revoked';
  created_at: string;
  used_at: string | null;
  used_by_property_id: string | null;
  property?: {
    name: string;
  };
}

export default function SubscriptionManagementPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unused' | 'used'>('all');
  const supabase = createClient();
  const router = useRouter();

  const fetchLicenses = useCallback(async () => {
    setIsLoading(true);
    try {
      // Security check: Only super_admin or admin can access
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
      }

      const { data, error } = await supabase
        .from('licenses')
        .select(`
          *,
          property:used_by_property_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLicenses(data || []);
    } catch (err) {
      console.error('Error fetching licenses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const generateLicense = async () => {
    setIsGenerating(true);
    try {
      // Generate a random key: XXXX-XXXX-XXXX-XXXX
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const key = `${segment()}-${segment()}-${segment()}-${segment()}`;

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('licenses')
        .insert({
          key,
          plan: 'pro',
          status: 'unused',
          created_by: user?.id
        });

      if (error) throw error;
      await fetchLicenses();
    } catch (err) {
      console.error('Error generating license:', err);
      alert('Failed to generate license key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const filteredLicenses = licenses.filter(l => {
    const matchesSearch = l.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         l.property?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Subscription Management
          </h1>
          <p className="text-slate-500 font-medium">
            Generate and manage license keys for properties.
          </p>
        </div>
        <button
          onClick={generateLicense}
          disabled={isGenerating}
          className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
        >
          {isGenerating ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          Generate New License
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Licenses</p>
              <h3 className="text-2xl font-black text-slate-900">{licenses.length}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active/Used</p>
              <h3 className="text-2xl font-black text-slate-900">
                {licenses.filter(l => l.status === 'used').length}
              </h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
              <Key size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Available</p>
              <h3 className="text-2xl font-black text-slate-900">
                {licenses.filter(l => l.status === 'unused').length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by license key or property name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${statusFilter === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('unused')}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${statusFilter === 'unused' ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            Unused
          </button>
          <button
            onClick={() => setStatusFilter('used')}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${statusFilter === 'used' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            Used
          </button>
        </div>
      </div>

      {/* Licenses Table/List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">License Key</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Created</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Used By</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-8">
                        <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredLicenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Key size={48} className="opacity-20" />
                        <p className="font-bold">No licenses found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLicenses.map((license) => (
                    <motion.tr
                      key={license.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${license.status === 'unused' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                            <Key size={16} />
                          </div>
                          <span className="font-mono font-bold text-slate-700 tracking-wider">
                            {license.key}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          license.status === 'unused' 
                            ? 'bg-amber-100 text-amber-700' 
                            : license.status === 'used'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {license.status === 'unused' && <AlertCircle size={12} />}
                          {license.status === 'used' && <CheckCircle2 size={12} />}
                          <span className="capitalize">{license.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                          <Calendar size={14} />
                          {format(new Date(license.created_at), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {license.property ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                              <Building2 size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{license.property.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">
                                {license.used_at ? format(new Date(license.used_at), 'MMM d, yyyy') : '-'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 font-medium italic">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyToClipboard(license.key)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Copy Key"
                          >
                            <Copy size={18} />
                          </button>
                          {license.used_by_property_id && (
                            <button
                              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                              title="View Property"
                            >
                              <ExternalLink size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
