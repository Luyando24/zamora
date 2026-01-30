'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Key, Search, RefreshCw, 
  CheckCircle2, AlertCircle, Copy, ExternalLink,
  ShieldCheck, CreditCard, Calendar as CalendarIcon, Building2,
  Clock, Check, Trash2, Ban, ArrowUpCircle, Link2Off
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { format, addDays, differenceInDays, startOfDay } from 'date-fns';
import { useRouter } from 'next/navigation';

interface License {
  id: string;
  key: string;
  plan: string;
  status: 'unused' | 'used' | 'revoked';
  duration_days: number;
  created_at: string;
  used_at: string | null;
  expires_at: string | null;
  used_by_property_id: string | null;
  property?: {
    name: string;
  };
}

interface LicensePlan {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  currency: string;
  is_active: boolean;
}

export default function SubscriptionManagementPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [plans, setPlans] = useState<LicensePlan[]>([]);
  const [activeTab, setActiveTab] = useState<'licenses' | 'plans'>('licenses');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unused' | 'used'>('all');
  const [selectedDuration, setSelectedDuration] = useState<number | 'custom'>(365);
  const [customEndDate, setCustomEndDate] = useState<string>(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [editingPlan, setEditingPlan] = useState<LicensePlan | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
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
        setUserRole(profile?.role || null);
      }

      // Fetch Licenses
      const { data: licensesData, error: licensesError } = await supabase
        .from('licenses')
        .select(`
          *,
          property:used_by_property_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (licensesError) throw licensesError;
      setLicenses(licensesData || []);

      // Fetch Plans
      const { data: plansData, error: plansError } = await supabase
        .from('license_plans')
        .select('*')
        .order('duration_days', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateLicense = async () => {
    setIsGenerating(true);
    try {
      let finalDurationDays = typeof selectedDuration === 'number' ? selectedDuration : 30;
      let planName = 'Pro Plan';
      
      if (selectedDuration === 'custom') {
        const end = startOfDay(new Date(customEndDate));
        const start = startOfDay(new Date());
        finalDurationDays = Math.max(1, differenceInDays(end, start));
        planName = `Custom (${finalDurationDays} Days)`;
      } else {
        const selectedPlan = plans.find(p => p.duration_days === selectedDuration);
        if (selectedPlan) {
          planName = selectedPlan.name;
        }
      }

      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
      const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const key = `ZAM-${segment()}-${segment()}-${segment()}`;

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('licenses')
        .insert({
          key,
          plan: planName,
          status: 'unused',
          duration_days: finalDurationDays,
          created_by: user?.id
        });

      if (error) throw error;
      setShowGenerateModal(false);
      await fetchData();
    } catch (err) {
      console.error('Error generating license:', err);
      alert('Failed to generate license key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const savePlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const planData = {
      name: formData.get('name') as string,
      duration_days: parseInt(formData.get('duration_days') as string),
      price: parseFloat(formData.get('price') as string),
      currency: formData.get('currency') as string,
      is_active: true
    };

    try {
      if (editingPlan) {
        const { error } = await supabase
          .from('license_plans')
          .update(planData)
          .eq('id', editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('license_plans')
          .insert(planData);
        if (error) throw error;
      }
      setShowPlanModal(false);
      setEditingPlan(null);
      await fetchData();
    } catch (err) {
      console.error('Error saving plan:', err);
      alert('Failed to save plan.');
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      const { error } = await supabase
        .from('license_plans')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error('Error deleting plan:', err);
      alert('Failed to delete plan.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const deactivateLicense = async (license: License) => {
    if (!confirm(`Are you sure you want to deactivate license ${license.key}?`)) return;
    
    try {
      // 1. Update license status
      const { error: licenseError } = await supabase
        .from('licenses')
        .update({ status: 'revoked' })
        .eq('id', license.id);

      if (licenseError) throw licenseError;

      // 2. If it was used by a property, update the property
      if (license.used_by_property_id) {
        const { error: propError } = await supabase
          .from('properties')
          .update({ 
            subscription_status: 'trial',
            subscription_plan: 'trial', // Reset plan too
            license_expires_at: new Date().toISOString() // Expire immediately
          })
          .eq('id', license.used_by_property_id);
        
        if (propError) throw propError;
      }

      await fetchData();
    } catch (err) {
      console.error('Error deactivating license:', err);
      alert('Failed to deactivate license.');
    }
  };

  const deleteLicense = async (license: License) => {
    if (license.status === 'used') {
      if (!confirm(`This license is currently IN USE by ${license.property?.name}. Deleting it will also deactivate their subscription. Continue?`)) return;
    } else {
      if (!confirm(`Are you sure you want to delete license ${license.key}?`)) return;
    }

    try {
      // If used, handle property update first
      if (license.used_by_property_id) {
        await supabase
          .from('properties')
          .update({ 
            subscription_status: 'trial',
            subscription_plan: 'trial',
            license_expires_at: new Date().toISOString()
          })
          .eq('id', license.used_by_property_id);
      }

      const { error } = await supabase
        .from('licenses')
        .delete()
        .eq('id', license.id);

      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error('Error deleting license:', err);
      alert('Failed to delete license.');
    }
  };

  const unassignLicense = async (license: License) => {
    if (!license.used_by_property_id) return;
    if (!confirm(`Are you sure you want to unassign license ${license.key} from ${license.property?.name}? The license will become UNUSED and available again.`)) return;

    try {
      // 1. Update property
      const { error: propError } = await supabase
        .from('properties')
        .update({ 
          subscription_status: 'trial',
          subscription_plan: 'trial',
          license_expires_at: new Date().toISOString()
        })
        .eq('id', license.used_by_property_id);

      if (propError) throw propError;

      // 2. Update license
      const { error: licenseError } = await supabase
        .from('licenses')
        .update({
          status: 'unused',
          used_by_property_id: null,
          used_at: null,
          expires_at: null
        })
        .eq('id', license.id);

      if (licenseError) throw licenseError;

      await fetchData();
    } catch (err) {
      console.error('Error unassigning license:', err);
      alert('Failed to unassign license.');
    }
  };

  const handleUpgradeLicense = async () => {
    if (!selectedLicense) return;
    setIsGenerating(true);

    try {
      let finalDurationDays = typeof selectedDuration === 'number' ? selectedDuration : 30;
      let planName = 'Pro Plan';
      
      if (selectedDuration === 'custom') {
        const end = startOfDay(new Date(customEndDate));
        const start = startOfDay(new Date());
        finalDurationDays = Math.max(1, differenceInDays(end, start));
        planName = `Custom (${finalDurationDays} Days)`;
      } else {
        const selectedPlan = plans.find(p => p.duration_days === selectedDuration);
        if (selectedPlan) {
          planName = selectedPlan.name;
        }
      }

      // Calculate new expiration date if it's already used
      let newExpiresAt = selectedLicense.expires_at;
      if (selectedLicense.used_at) {
        newExpiresAt = addDays(new Date(selectedLicense.used_at), finalDurationDays).toISOString();
      }

      // 1. Update license
      const { error: licenseError } = await supabase
        .from('licenses')
        .update({
          duration_days: finalDurationDays,
          plan: planName,
          expires_at: newExpiresAt
        })
        .eq('id', selectedLicense.id);

      if (licenseError) throw licenseError;

      // 2. Update property if used
      if (selectedLicense.used_by_property_id && newExpiresAt) {
        const { error: propError } = await supabase
          .from('properties')
          .update({
            license_expires_at: newExpiresAt
          })
          .eq('id', selectedLicense.used_by_property_id);
        
        if (propError) throw propError;
      }

      setShowUpgradeModal(false);
      setSelectedLicense(null);
      await fetchData();
    } catch (err) {
      console.error('Error upgrading license:', err);
      alert('Failed to upgrade license.');
    } finally {
      setIsGenerating(false);
    }
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
            Generate licenses and manage pricing plans.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingPlan(null);
              setShowPlanModal(true);
            }}
            className="bg-white border-2 border-slate-100 text-slate-700 font-bold py-3 px-6 rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Plan
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <Key className="w-5 h-5" />
            Generate License
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('licenses')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'licenses' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Licenses
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'plans' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Pricing Plans
        </button>
      </div>

      {activeTab === 'licenses' ? (
        <>
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
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Duration</th>
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
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 text-sm text-slate-900 font-bold">
                            <Clock size={14} className="text-slate-400" />
                            {license.duration_days >= 36500 ? 'Lifetime' : `${license.duration_days} Days`}
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Created {format(new Date(license.created_at), 'MMM d, yyyy')}
                          </p>
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
                                Expires {license.expires_at ? format(new Date(license.expires_at), 'MMM d, yyyy') : '-'}
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
                          
                          <button
                            onClick={() => {
                              setSelectedLicense(license);
                              setSelectedDuration(license.duration_days);
                              setShowUpgradeModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Upgrade/Edit License"
                          >
                            <ArrowUpCircle size={18} />
                          </button>

                          {license.status !== 'revoked' && (
                            <button
                              onClick={() => deactivateLicense(license)}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              title="Deactivate/Revoke License"
                            >
                              <Ban size={18} />
                            </button>
                          )}

                          {userRole === 'super_admin' && license.used_by_property_id && (
                            <button
                              onClick={() => unassignLicense(license)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Release/Unassign License from Property"
                            >
                              <Link2Off size={18} />
                            </button>
                          )}

                          <button
                            onClick={() => deleteLicense(license)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete License"
                          >
                            <Trash2 size={18} />
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
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from(new Map(plans.map(p => [p.duration_days, p])).values()).map((plan) => (
            <div key={plan.id} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                  <CreditCard size={24} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingPlan(plan);
                      setShowPlanModal(true);
                    }}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <RefreshCw size={18} />
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <AlertCircle size={18} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h3>
              <p className="text-slate-500 font-medium mb-6">
                {plan.duration_days >= 36500 ? 'Lifetime access' : `${plan.duration_days} days validity`}
              </p>
              
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-slate-400 uppercase tracking-wider">{plan.currency}</span>
                <span className="text-4xl font-black text-slate-900">{plan.price.toLocaleString()}</span>
              </div>
            </div>
          ))}
          
          <button
            onClick={() => {
              setEditingPlan(null);
              setShowPlanModal(true);
            }}
            className="border-2 border-dashed border-slate-200 rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-600 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Plus size={24} />
            </div>
            <span className="font-bold">Add New Pricing Plan</span>
          </button>
        </div>
      )}

      {/* Generate License Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGenerateModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[32px] shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <Key size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Generate License</h2>
                    <p className="text-sm font-medium text-slate-500">Select duration and plan</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">
                      License Duration
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {Array.from(new Map(plans.map(p => [p.duration_days, p])).values()).map((plan) => (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedDuration(plan.duration_days)}
                          className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex flex-col items-start gap-0.5 ${
                            selectedDuration === plan.duration_days 
                              ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20' 
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{plan.name}</span>
                            {selectedDuration === plan.duration_days && <Check size={16} />}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedDuration === plan.duration_days ? 'text-blue-200' : 'text-slate-400'}`}>
                            {plan.currency} {plan.price.toLocaleString()}
                          </span>
                        </button>
                      ))}
                      <button
                        onClick={() => setSelectedDuration('custom')}
                        className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-between col-span-2 ${
                          selectedDuration === 'custom' 
                            ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CalendarIcon size={16} />
                          Custom Period
                        </div>
                        {selectedDuration === 'custom' && <Check size={16} />}
                      </button>
                    </div>

                    {selectedDuration === 'custom' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2 p-4 bg-blue-50 rounded-2xl border border-blue-100"
                      >
                        <label className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                          Select Expiration Date
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <p className="text-[10px] text-blue-600 font-bold uppercase">
                          Duration: {differenceInDays(startOfDay(new Date(customEndDate)), startOfDay(new Date()))} Days
                        </p>
                      </motion.div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 text-slate-600">
                      <ShieldCheck size={18} className="text-blue-600" />
                      <span className="text-sm font-bold">Pro Plan Features Included</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowGenerateModal(false)}
                      className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={generateLicense}
                      disabled={isGenerating}
                      className="flex-[2] bg-blue-900 hover:bg-blue-800 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          Generate Key
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Upgrade/Edit License Modal */}
      <AnimatePresence>
        {showUpgradeModal && selectedLicense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowUpgradeModal(false);
                setSelectedLicense(null);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[32px] shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <ArrowUpCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Upgrade License</h2>
                    <p className="text-sm font-medium text-slate-500">Key: {selectedLicense.key}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">
                      New Duration / Plan
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {Array.from(new Map(plans.map(p => [p.duration_days, p])).values()).map((plan) => (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedDuration(plan.duration_days)}
                          className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex flex-col items-start gap-0.5 ${
                            selectedDuration === plan.duration_days 
                              ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20' 
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{plan.name}</span>
                            {selectedDuration === plan.duration_days && <Check size={16} />}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedDuration === plan.duration_days ? 'text-blue-200' : 'text-slate-400'}`}>
                            {plan.currency} {plan.price.toLocaleString()}
                          </span>
                        </button>
                      ))}
                      <button
                        onClick={() => setSelectedDuration('custom')}
                        className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-between col-span-2 ${
                          selectedDuration === 'custom' 
                            ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/20' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CalendarIcon size={16} />
                          Custom Period
                        </div>
                        {selectedDuration === 'custom' && <Check size={16} />}
                      </button>
                    </div>

                    {selectedDuration === 'custom' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2 p-4 bg-blue-50 rounded-2xl border border-blue-100"
                      >
                        <label className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                          Select Expiration Date
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <p className="text-[10px] text-blue-600 font-bold uppercase">
                          Duration: {differenceInDays(startOfDay(new Date(customEndDate)), startOfDay(new Date()))} Days
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {selectedLicense.status === 'used' && (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <div className="flex items-start gap-3 text-amber-800">
                        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs font-medium">
                          This license is currently in use. Upgrading it will update the expiration date for <strong>{selectedLicense.property?.name}</strong> immediately.
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowUpgradeModal(false);
                        setSelectedLicense(null);
                      }}
                      className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpgradeLicense}
                      disabled={isGenerating}
                      className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <ArrowUpCircle className="w-5 h-5" />
                          Apply Upgrade
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pricing Plan Modal */}
      <AnimatePresence>
        {showPlanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPlanModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[32px] shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <form onSubmit={savePlan} className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{editingPlan ? 'Edit Pricing Plan' : 'New Pricing Plan'}</h2>
                    <p className="text-sm font-medium text-slate-500">Define license cost and duration</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Plan Name</label>
                    <input
                      name="name"
                      required
                      defaultValue={editingPlan?.name}
                      placeholder="e.g. 1 Year Pro"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Duration (Days)</label>
                      <input
                        name="duration_days"
                        type="number"
                        required
                        defaultValue={editingPlan?.duration_days}
                        placeholder="365"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Price</label>
                      <input
                        name="price"
                        type="number"
                        step="0.01"
                        required
                        defaultValue={editingPlan?.price}
                        placeholder="450.00"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Currency</label>
                    <select
                      name="currency"
                      defaultValue={editingPlan?.currency || 'USD'}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="ZMW">ZMW (K)</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowPlanModal(false)}
                      className="flex-1 bg-slate-50 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-900 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-all"
                    >
                      {editingPlan ? 'Update Plan' : 'Create Plan'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
