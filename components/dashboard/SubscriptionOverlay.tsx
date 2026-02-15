'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Send, AlertCircle, CheckCircle2, ChevronLeft, Check, Calendar, CreditCard } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useProperty } from '@/app/dashboard/context/PropertyContext';
import { addDays, format, differenceInDays, startOfDay } from 'date-fns';

interface LicensePlan {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  currency: string;
}

export default function SubscriptionOverlay() {
  const { isTrialExpired, daysRemaining, selectedProperty, refreshProperties } = useProperty();
  const [licenseKey, setLicenseKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [view, setView] = useState<'main' | 'request'>('main');
  
  // Request Form State
  const [plans, setPlans] = useState<LicensePlan[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number | 'custom'>(365);
  const [customEndDate, setCustomEndDate] = useState<string>(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [feedback, setFeedback] = useState('');
  const [userProfile, setUserProfile] = useState<{ email: string; full_name: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);
      }

      const { data: plansData } = await supabase
        .from('license_plans')
        .select('*')
        .eq('is_active', true)
        .order('duration_days', { ascending: true });
      
      if (plansData) {
        setPlans(plansData);
        // Set initial selected duration to the 1 year plan if available
        const yearPlan = plansData.find(p => p.duration_days === 365);
        if (yearPlan) setSelectedDuration(365);
      }
    }
    fetchData();
  }, [supabase]);

  const getSelectedPlanPrice = () => {
    if (selectedDuration === 'custom') {
      const end = startOfDay(new Date(customEndDate));
      const start = startOfDay(new Date());
      const days = Math.max(1, differenceInDays(end, start));
      
      if (plans.length === 0) return 0;
      
      // Find the closest plan to determine a daily rate
      const basePlan = [...plans].reverse().find(p => p.duration_days <= days) || plans[0];
      const dailyRate = basePlan.price / basePlan.duration_days;
      return dailyRate * days;
    }
    
    const plan = plans.find(p => p.duration_days === selectedDuration);
    return plan ? plan.price : 0;
  };

  const getCurrentDays = () => {
    if (selectedDuration === 'custom') {
      const end = startOfDay(new Date(customEndDate));
      const start = startOfDay(new Date());
      return Math.max(1, differenceInDays(end, start));
    }
    return typeof selectedDuration === 'number' ? selectedDuration : 30;
  };

  if (!isTrialExpired && daysRemaining > 3) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: license, error: verifyError } = await supabase
        .from('licenses')
        .select('*')
        .eq('key', licenseKey.trim())
        .eq('status', 'unused')
        .single();

      if (verifyError || !license) {
        throw new Error('Invalid or already used license key.');
      }

      const expirationDate = addDays(new Date(), license.duration_days).toISOString();

      const { error: updateError } = await supabase
        .from('properties')
        .update({
          subscription_plan: 'pro',
          subscription_status: 'active_licensed',
          license_expires_at: expirationDate,
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

  const handleWhatsAppRequest = () => {
    const finalDays = getCurrentDays();
    const finalPrice = getSelectedPlanPrice();
    const currency = plans[0]?.currency || 'USD';
    const selectedPlan = typeof selectedDuration === 'number' ? plans.find(p => p.duration_days === selectedDuration) : null;

    const durationText = selectedPlan ? selectedPlan.name : (finalDays >= 36500 ? 'Lifetime' : `${finalDays} Days`);
    const message = `Hello Zamora Admin,\n\nI would like to request a new license key.\n\n*Property Details:*\n- Name: ${selectedProperty?.name}\n- ID: ${selectedProperty?.id}\n\n*User Details:*\n- Name: ${userProfile?.full_name || 'N/A'}\n- Email: ${userProfile?.email || 'N/A'}\n\n*Requested Validity:* ${durationText}\n*Estimated Cost:* ${currency} ${finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n${selectedDuration === 'custom' ? `*Target Expiration:* ${customEndDate}` : ''}${feedback ? `\n\n*User Feedback:* ${feedback}` : ''}\n\nPlease let me know the next steps. Thank you!`;

    const whatsappUrl = `https://wa.me/8614768628270?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${isTrialExpired ? 'bg-slate-900/90 backdrop-blur-md' : 'pointer-events-none'}`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden max-w-2xl w-full pointer-events-auto ${!isTrialExpired ? 'fixed bottom-24 right-6 w-80 shadow-xl' : ''}`}
      >
        <AnimatePresence mode="wait">
          {view === 'main' ? (
            <motion.div 
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-8"
            >
              {isTrialExpired ? (
                <>
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Subscription Expired</h2>
                  <p className="text-slate-500 mb-8 leading-relaxed font-medium">
                    Your current subscription for <span className="font-bold text-slate-900">{selectedProperty?.name}</span> has expired. Please enter a license key to continue using Zamora.
                  </p>

                  {success ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-emerald-900 mb-1">License Activated!</h3>
                      <p className="text-emerald-700 text-sm font-medium">Thank you for choosing Zamora. Refreshing your dashboard...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">License Key</label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text"
                            required
                            value={licenseKey}
                            onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                            placeholder="ZAM-XXXX-XXXX-XXXX"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-mono font-bold text-slate-800 placeholder:text-slate-300"
                          />
                        </div>
                        {error && <p className="text-xs text-red-600 font-bold mt-2 ml-1 flex items-center gap-1"><AlertCircle size={12}/> {error}</p>}
                      </div>

                      <button 
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                      >
                        {isSubmitting ? 'Verifying...' : 'Activate License'}
                      </button>

                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-black tracking-widest">OR</span></div>
                      </div>

                      <button 
                        type="button"
                        onClick={() => setView('request')}
                        className="w-full bg-white border-2 border-slate-100 text-slate-700 font-black py-4 rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Request New License
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <div className="p-2">
                  <div className="flex gap-4">
                    <div className="p-3 bg-amber-50 rounded-2xl h-fit text-amber-600">
                      <AlertCircle size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-slate-900">Subscription Expiring Soon</h3>
                      <p className="text-sm text-slate-500 mt-1 leading-relaxed font-medium">
                        Your subscription expires in <span className="font-black text-amber-600">{daysRemaining} days</span>. 
                        Get a license key now to avoid interruption.
                      </p>
                      <button 
                        onClick={() => {/* Add navigation to settings or scroll to input */}}
                        className="mt-4 text-sm font-black text-primary hover:underline flex items-center gap-1"
                      >
                        Enter License Key <Key size={14}/>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="request"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <button 
                onClick={() => setView('main')}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-sm uppercase tracking-widest mb-6 transition-colors"
              >
                <ChevronLeft size={16} /> Back
              </button>

              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Send className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Request License</h2>
              <p className="text-slate-500 mb-8 leading-relaxed font-medium">
                Select the desired validity period for your property license.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
                    Select Validity
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedDuration(plan.duration_days)}
                        className={`px-4 py-4 rounded-2xl text-sm font-black transition-all flex flex-col items-start gap-1 ${
                          selectedDuration === plan.duration_days 
                            ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{plan.name}</span>
                          {selectedDuration === plan.duration_days && <Check size={16} />}
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider ${selectedDuration === plan.duration_days ? 'text-primary-100' : 'text-slate-400'}`}>
                          {plan.currency} {plan.price.toLocaleString()}
                        </span>
                      </button>
                    ))}
                    <button
                      onClick={() => setSelectedDuration('custom')}
                      className={`px-4 py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-between col-span-3 ${
                        selectedDuration === 'custom' 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        Custom Date
                      </div>
                      {selectedDuration === 'custom' && <Check size={16} />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {(selectedDuration === 'custom' || plans.length > 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-slate-900 rounded-3xl border border-slate-800 mb-6 relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                          <CreditCard size={48} className="text-white" />
                        </div>
                        
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Pricing Summary</span>
                            <div className="px-2 py-1 bg-primary/20 rounded-lg">
                              <span className="text-[10px] font-black text-primary uppercase tracking-wider">Estimated</span>
                            </div>
                          </div>
                          
                          <div className="flex items-end justify-between">
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white">
                                  {plans[0]?.currency || 'USD'} {getSelectedPlanPrice().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-500 mt-1">
                                For {getCurrentDays()} {getCurrentDays() === 1 ? 'day' : 'days'} of full access
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {selectedDuration === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2 p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-4"
                    >
                      <label className="text-xs font-black text-primary uppercase tracking-wider block ml-1">
                        Target Expiration
                      </label>
                      <input
                        type="date"
                        min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full bg-white border border-primary/20 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10"
                      />
                    </motion.div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">
                    Feedback (Optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us about your experience or special requirements..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-none placeholder:text-slate-300"
                  />
                </div>

                <button 
                  onClick={handleWhatsAppRequest}
                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-5 rounded-2xl shadow-xl shadow-green-900/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                >
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Request via WhatsApp
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
