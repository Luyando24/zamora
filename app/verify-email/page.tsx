'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>('');
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;
      setMessage('Verification email sent successfully.');
    } catch (error: any) {
      setMessage(error.message || 'Failed to resend email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center p-4 relative overflow-hidden">
       {/* Background Effects */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-zambia-green/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-zambia-blue/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
            <Mail size={32} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
        <p className="text-gray-400 text-sm mb-1">
          We've sent a verification link to
        </p>
        <p className="text-white font-medium mb-6">
          {email || 'your email address'}
        </p>

        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          Click the link in the email to verify your account.<br/>
          If you don't see it, check your spam folder.
        </p>

        <Link 
          href="/login"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>

        <div className="mt-8 text-sm text-gray-500">
          Didn't receive the email?{' '}
          <button 
            onClick={handleResend}
            disabled={resending || !email}
            className="text-zambia-green hover:text-green-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? 'Resending...' : 'Resend'}
          </button>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 text-xs p-2 rounded-lg ${message.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}
          >
            {message}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-zambia-green" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
