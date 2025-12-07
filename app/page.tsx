'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, BarChart3, ShieldCheck, Zap, Smartphone } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden selection:bg-zambia-green selection:text-white">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-[#030712]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-zambia-green to-zambia-blue flex items-center justify-center font-bold text-xl shadow-lg shadow-zambia-green/20">
              Z
            </div>
            <span className="font-bold text-xl tracking-tight">ZAMORA</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#compliance" className="hover:text-white transition-colors">Compliance</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="group relative px-6 py-2.5 bg-white text-[#030712] rounded-full font-bold text-sm hover:bg-gray-100 transition-all active:scale-95"
            >
              Get Started
              <span className="absolute inset-0 rounded-full ring-2 ring-white/50 group-hover:ring-white/80 transition-all animate-pulse"></span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-zambia-green/20 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-zambia-blue/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-zambia-green text-xs font-bold tracking-wider mb-6">
                NEXT-GEN HOSPITALITY OS
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50"
            >
              Manage your hotel like <br />
              <span className="text-white">it's 2050.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Zamora is the all-in-one Property Management System built for speed, compliance, and growth. ZRA-integrated, cloud-native, and beautifully designed.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-4 bg-zambia-green text-white rounded-full font-bold text-lg hover:bg-zambia-green/90 transition-all flex items-center justify-center gap-2 group"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-sm">
                Book Demo
              </button>
            </motion.div>
          </div>

          {/* Hero Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-zambia-green to-zambia-blue rounded-2xl blur opacity-20"></div>
            <div className="relative bg-[#0f1623] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#030712]">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" 
                alt="Dashboard Preview" 
                className="w-full h-auto opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                 <p className="text-white/50 font-mono text-sm">Interactive Dashboard Preview</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-[#030712] relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Everything you need. <br /><span className="text-gray-500">Nothing you don't.</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8 text-blue-400" />}
              title="Real-time Analytics"
              description="Track occupancy, RevPAR, and revenue in real-time with beautiful, actionable charts."
            />
            <FeatureCard 
              id="compliance"
              icon={<ShieldCheck className="w-8 h-8 text-zambia-green" />}
              title="ZRA Compliance"
              description="Automated Smart Invoice fiscalization. Never worry about tax compliance again."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-yellow-400" />}
              title="Instant Booking"
              description="Lightning fast booking engine for your front desk and public website."
            />
            <FeatureCard 
              icon={<Smartphone className="w-8 h-8 text-purple-400" />}
              title="Mobile First"
              description="Manage your property from anywhere. Fully responsive design for all devices."
            />
            <div className="md:col-span-2 bg-gradient-to-br from-white/5 to-transparent p-8 rounded-3xl border border-white/10 hover:border-white/20 transition-colors group">
              <h3 className="text-2xl font-bold mb-4 group-hover:text-zambia-green transition-colors">Integrated Food & Beverage</h3>
              <p className="text-gray-400 mb-8 max-w-md">
                Seamlessly manage your restaurant and bar. Orders are automatically linked to guest folios for a unified billing experience.
              </p>
              <div className="grid grid-cols-3 gap-4 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="h-20 bg-white/5 rounded-xl"></div>
                <div className="h-20 bg-white/5 rounded-xl"></div>
                <div className="h-20 bg-white/5 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712] to-zambia-green/20"></div>
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl lg:text-6xl font-bold mb-8">Ready to modernize?</h2>
          <p className="text-xl text-gray-300 mb-12">
            Join the forward-thinking hotels using Zamora to streamline operations and delight guests.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-10 py-5 bg-white text-[#030712] rounded-full font-bold text-xl hover:scale-105 transition-transform"
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 bg-[#02050c]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-sm">Z</div>
            <span className="font-bold tracking-tight">ZAMORA</span>
          </div>
          <div className="text-sm text-gray-500">
            © 2025 Zamora Systems. Built for Zambia 🇿🇲
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-gray-500 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, id }: { icon: React.ReactNode, title: string, description: string, id?: string }) {
  return (
    <div id={id} className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-1 group scroll-mt-24">
      <div className="mb-6 p-3 bg-white/5 rounded-2xl w-fit group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
