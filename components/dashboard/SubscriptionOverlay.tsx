'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useProperty } from '@/app/dashboard/context/PropertyContext';
import { addDays } from 'date-fns';

export default function SubscriptionOverlay() {
  const { isTrialExpired, daysRemaining, selectedProperty, refreshProperties } = useProperty();
  const [licenseKey, setLicenseKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  if (!isTrialExpired && daysRemaining > 3) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Verify license key
      const { data: license, error: verifyError } = await supabase
        .from('licenses')
        .select('*')
        .eq('key', licenseKey.trim())
        .eq('status', 'unused')
        .single();

      if (verifyError || !license) {
        throw new Error('Invalid or already used license key.');
      }

      // 2. Calculate expiration date
      const expirationDate = addDays(new Date(), license.duration_days).toISOString();

      // 3. Update property subscription
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          subscription_plan: 'pro',
          subscription_status: 'active_licensed',
          license_expires_at: expirationDate, // Using our new column
          settings: {
            ...(selectedProperty?.settings || {}),
            license_key: licenseKey.trim(),
            licensed_at: new Date().toISOString(),
            license_duration: license.duration_days,
            license_expires_at: expirationDate
          }
        })
        .eq('id', selectedProperty?.id);

      if (updateError) throw updateError;

      // 4. Mark license as used and set its expiration
      await supabase
        .from('licenses')
        .update({ 
          status: 'used', 
          used_by_property_id: selectedProperty?.id,
          used_at: new Date().toISOString(),
          expires_at: expirationDate
        })
        .eq('id', license.id);

      setSuccess(true);
      setTimeout(() => {
        refreshProperties();
      }, 2000);
    } catch (err: any) {
      console.error('License activation error:', err);
      setError(err.message || 'Failed to verify license key.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestLicense = async () => {
    alert('License request sent to admin. You will be contacted via email.');
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${isTrialExpired ? 'bg-slate-900/90 backdrop-blur-md' : 'pointer-events-none'}`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-w-lg w-full pointer-events-auto ${!isTrialExpired ? 'fixed bottom-24 right-6 w-80 shadow-xl' : ''}`}
      >
        {isTrialExpired ? (
          <div className="p-8">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Trial Expired</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Your 14-day free trial for <span className="font-bold text-slate-900">{selectedProperty?.name}</span> has ended. Please enter a license key to continue using Zamora.
            </p>

            {success ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-emerald-900 mb-1">License Activated!</h3>
                <p className="text-emerald-700 text-sm">Thank you for choosing Zamora. Refreshing your dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">License Key</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      required
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                      placeholder="ZAM-XXXX-XXXX-XXXX"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                  {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Verifying...' : 'Activate License'}
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-widest">OR</span></div>
                </div>

                <button 
                  type="button"
                  onClick={handleRequestLicense}
                  className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Request New License
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="p-5 bg-amber-50 border-l-4 border-amber-500">
            <div className="flex gap-4">
              <div className="p-2 bg-amber-100 rounded-lg h-fit text-amber-600">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-amber-900">Trial Ending Soon</h3>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Your trial ends in <span className="font-bold">{daysRemaining} days</span>. 
                  Get a license key now to avoid interruption.
                </p>
                <button 
                  onClick={() => {/* Navigate to settings or show expanded form */}}
                  className="mt-3 text-xs font-bold text-amber-900 hover:underline"
                >
                  Enter License Key
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
