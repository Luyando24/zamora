'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, ArrowRight, ArrowLeft, Mail, Lock, User, Building2, Check, PenTool } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ServiceContractModal from '@/components/auth/ServiceContractModal';

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contractAgreed, setContractAgreed] = useState(false);
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
      setStep(3);
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

    // Validate email domain
    const allowedDomains = ['zamora.com', 'gmail.com'];
    const emailDomain = trimmedEmail.split('@')[1];
    
    if (!allowedDomains.includes(emailDomain)) {
      setError('This email domain is not authorized for signup.');
      setLoading(false);
      return;
    }

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
            contract_signer: signerName
          }
        }
      });

      if (authError) throw authError;

      // Direct redirect to dashboard or login, skipping email verification screen
      if (authData.session) {
        router.push('/dashboard');
      } else {
         // Even if no session (verification technically required by Supabase),
         // we treat it as successful and redirect to login or dashboard.
         // We remove the specific /verify-email page requirement.
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
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-zambia-green/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-zambia-blue/20 rounded-full blur-[120px] animate-pulse delay-1000" />
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-zambia-green to-zambia-blue flex items-center justify-center font-bold text-3xl shadow-lg shadow-zambia-green/20 mb-6">
              Z
            </div>
            <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
              Join the future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-zambia-green to-zambia-blue">Hospitality</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Start your 14-day free trial. No credit card required. Setup your hotel in minutes.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
              <div className="p-3 bg-zambia-green/20 rounded-lg text-zambia-green">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white">All-in-one Platform</h3>
                <p className="text-sm text-gray-400">Rooms, F&B, and Accounting in one place.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
              <div className="p-3 bg-zambia-blue/20 rounded-lg text-zambia-blue">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white">Unlimited Staff</h3>
                <p className="text-sm text-gray-400">Add your entire team at no extra cost.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10 h-full overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl my-auto"
        >
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex space-x-2 mb-3">
              <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-zambia-green' : 'bg-white/10'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-zambia-green' : 'bg-white/10'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step >= 3 ? 'bg-zambia-green' : 'bg-white/10'}`} />
            </div>
            <div className="flex justify-between px-1">
              <span className={`text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${step >= 1 ? 'text-zambia-green' : 'text-gray-500'}`}>
                Personal
              </span>
              <span className={`text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${step >= 2 ? 'text-zambia-green' : 'text-gray-500'}`}>
                Security
              </span>
              <span className={`text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${step >= 3 ? 'text-zambia-green' : 'text-gray-500'}`}>
                Contract
              </span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {step === 1 ? "Let's start with your name" : step === 2 ? "Secure your account" : "Service Contract"}
            </h2>
            <p className="text-gray-400 text-sm">
              {step === 1 ? "Tell us who you are" : step === 2 ? "Create your login credentials" : "Sign the service contract to proceed"}
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
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">First Name</label>
                      <input
                        type="text"
                        required
                        className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-zambia-green focus:border-transparent transition-all"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Last Name</label>
                      <input
                        type="text"
                        required
                        className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-zambia-green focus:border-transparent transition-all"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
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
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="email"
                        required
                        className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-zambia-green focus:border-transparent transition-all"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="password"
                        required
                        className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-zambia-green focus:border-transparent transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters.</p>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-bold mb-2">Service Contract</h3>
                    <p className="text-sm text-gray-400 mb-6">
                      Please review and sign the Zamora Service Contract to create your account.
                      This agreement outlines the terms of use and your responsibilities.
                    </p>
                    
                    {contractAgreed ? (
                        <div className="flex items-center gap-4 p-4 bg-zambia-green/10 border border-zambia-green/20 rounded-xl">
                            <div className="w-10 h-10 bg-zambia-green rounded-full flex items-center justify-center text-white shrink-0">
                                <Check size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-zambia-green">Contract Signed</p>
                                <p className="text-xs text-gray-400">Signed by {signerName}</p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setIsContractModalOpen(true)}
                                className="ml-auto text-xs text-gray-400 hover:text-white underline"
                            >
                                View
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsContractModalOpen(true)}
                            className="w-full py-4 border-2 border-dashed border-white/20 hover:border-zambia-green/50 hover:bg-zambia-green/5 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group"
                        >
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-zambia-green/20 transition-colors">
                                <PenTool className="text-gray-400 group-hover:text-zambia-green" size={24} />
                            </div>
                            <span className="font-bold text-gray-300 group-hover:text-white">Review & Sign Contract</span>
                        </button>
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
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center justify-center px-4 py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10 w-14 flex-shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 bg-zambia-green hover:bg-zambia-green/90 text-white font-bold rounded-xl transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-zambia-green/25"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                  <>
                    {step < 3 ? 'Next Step' : 'Create Account'} 
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-zambia-green hover:text-green-400 font-medium transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
