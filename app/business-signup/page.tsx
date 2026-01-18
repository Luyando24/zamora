'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, ArrowRight, ArrowLeft, Mail, Lock, User, Check, PenTool, Building2 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ServiceContractModal from '@/components/auth/ServiceContractModal';

export default function BusinessSignupPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contractAgreed, setContractAgreed] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setError('Please enter your first and last name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!email.trim() || !password) {
        setError('Please enter your email and password.');
        return;
      }
      // Basic email validation
      if (!email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      setStep(3); // Go to contract step
    }
  };

  const handleContractSign = (signatureData: string, printedName: string) => {
    setContractAgreed(true);
    setSignerName(printedName);
    setIsContractModalOpen(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!contractAgreed) {
      setError('You must request contract signing to proceed.');
      setLoading(false);
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            contract_signed: true,
            contract_signed_at: new Date().toISOString(),
            contract_signer: signerName,
            role: 'manager' // Business account role
          }
        }
      });

      if (authError) throw authError;

         // Direct redirect to dashboard (which will prompt setup)
         if (authData.session) {
           router.push('/dashboard');
         } else {
            router.push('/login?message=Account created successfully. Please sign in.');
         } 
      
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white flex overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-zambia-red/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* Left Side - Visuals (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 items-center justify-center relative z-10 p-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg"
        >
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-zambia-red to-orange-600 flex items-center justify-center font-bold text-3xl shadow-lg shadow-zambia-red/20 mb-6">
              Z
            </div>
            <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
              Partner with <span className="text-transparent bg-clip-text bg-gradient-to-r from-zambia-red to-orange-600">Zamora</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Create your business account to start managing your properties and reaching more guests.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/10">
              <h3 className="font-bold text-white mb-1">Manage Properties</h3>
              <p className="text-sm text-gray-400">Efficiently manage all your listings in one place.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/10">
              <h3 className="font-bold text-white mb-1">Grow Business</h3>
              <p className="text-sm text-gray-400">Access powerful tools to increase your revenue.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 bg-white text-slate-900 flex flex-col justify-center items-center p-8 lg:p-12 relative z-20">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-zambia-red flex items-center justify-center font-bold text-white text-xl">Z</div>
            <span className="font-bold text-2xl tracking-tight">Zamora</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Create Business Account</h2>
            <p className="text-slate-500">
              Enter your details below to get started.
            </p>
          </div>

          <form onSubmit={step < 3 ? handleNext : handleSignup} className="space-y-5">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">First Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black/5 focus:border-slate-400 transition-all"
                          placeholder="Mulenga"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Last Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black/5 focus:border-slate-400 transition-all"
                          placeholder="Banda"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="email"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black/5 focus:border-slate-400 transition-all"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Create Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="password"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black/5 focus:border-slate-400 transition-all"
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Service Agreement</h3>
                            <p className="text-xs text-slate-500">Required for business accounts</p>
                        </div>
                     </div>
                     
                     <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                       To become a Zamora partner and manage properties, you must review and agree to our standard service terms and conditions.
                     </p>
                     
                     {!contractAgreed ? (
                       <button
                         type="button"
                         onClick={() => setIsContractModalOpen(true)}
                         className="w-full py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-zambia-red hover:text-zambia-red hover:bg-red-50 transition-all flex items-center justify-center gap-2 group"
                       >
                         <PenTool size={18} className="group-hover:scale-110 transition-transform" /> Sign Contract
                       </button>
                     ) : (
                       <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200">
                         <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                           <Check size={20} strokeWidth={3} />
                         </div>
                         <div className="flex-1">
                           <p className="font-bold text-sm">Contract Signed</p>
                           <p className="text-xs opacity-80">Signed by {signerName}</p>
                         </div>
                         <button 
                           type="button" 
                           onClick={() => setIsContractModalOpen(true)}
                           className="text-xs font-bold underline hover:no-underline"
                         >
                           View
                         </button>
                       </div>
                     )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <ServiceContractModal 
                isOpen={isContractModalOpen}
                onClose={() => setIsContractModalOpen(false)}
                onSign={handleContractSign}
                userName={`${firstName} ${lastName}`}
            />

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={18} /> Back
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="ml-auto px-8 py-3 bg-[#030712] text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center gap-2"
                >
                  Next Step <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !contractAgreed}
                  className="ml-auto px-8 py-3 bg-[#030712] text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Create Business Account'}
                </button>
              )}
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-zambia-red hover:text-red-400 font-medium transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
