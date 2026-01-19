'use client';

import { ArrowLeft, Mail, Phone, MessageSquare, MapPin } from 'lucide-react';
import Link from 'next/link';
import GuestBottomNav from '@/components/guest/GuestBottomNav';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <span className="font-black text-2xl tracking-[0.2em] uppercase text-slate-900">ZAMORA</span>
          </Link>
          <div className="flex items-center gap-4">
             <Link href="/explore" className="text-sm font-bold text-slate-500 hover:text-slate-900">Explore</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-12">
        <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                <ArrowLeft size={16} /> Back Home
            </Link>
            <h1 className="text-3xl font-black text-slate-900">Help & Support</h1>
            <p className="text-slate-500 mt-2 text-lg">We&apos;re here to help. Get in touch with us.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            
            <a href="mailto:support@zamora.com" className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:border-slate-300 transition-colors group">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                    <Mail size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">Email Support</h3>
                <p className="text-slate-500 text-sm mb-4">Get a response within 24 hours.</p>
                <span className="text-blue-600 font-bold text-sm">support@zamora.com</span>
            </a>

            <a href="tel:+260970000000" className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:border-slate-300 transition-colors group">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
                    <Phone size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">Call Us</h3>
                <p className="text-slate-500 text-sm mb-4">Mon-Fri from 8am to 5pm.</p>
                <span className="text-green-600 font-bold text-sm">+260 97 000 0000</span>
            </a>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm md:col-span-2">
                 <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1">
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-4">
                            <MapPin size={24} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1">Visit Our Office</h3>
                        <p className="text-slate-500 text-sm mb-4">Come say hello at our HQ.</p>
                        <p className="text-slate-900 font-medium">
                            123 Great East Road<br />
                            Lusaka, Zambia
                        </p>
                    </div>
                    <div className="w-full md:w-1/2 h-48 bg-slate-100 rounded-2xl overflow-hidden relative">
                        {/* Placeholder for map */}
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold bg-slate-200">
                            Map View
                        </div>
                    </div>
                 </div>
            </div>

        </div>

        <div className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2">Frequently Asked Questions</h3>
                <p className="text-slate-400 mb-6">Find answers to common questions about bookings, payments, and cancellations.</p>
                <button className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors">
                    View FAQ
                </button>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        </div>

      </main>
      <GuestBottomNav />
    </div>
  );
}
