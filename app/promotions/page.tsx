'use client';

import { ArrowLeft, Gift, Tag } from 'lucide-react';
import Link from 'next/link';
import GuestBottomNav from '@/components/guest/GuestBottomNav';

export default function PromotionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-tighter text-zambia-red flex items-center gap-2">
            <div className="w-8 h-8 bg-zambia-red rounded-lg flex items-center justify-center text-white">Z</div>
            <span className="hidden md:block">zamora</span>
          </Link>
          <div className="flex items-center gap-4">
             <Link href="/explore" className="text-sm font-bold text-slate-500 hover:text-slate-900">Explore</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-12">
        <div className="mb-8">
            <Link href="/explore" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                <ArrowLeft size={16} /> Back to Explore
            </Link>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                <Gift className="text-zambia-red" /> Promotions
            </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Promo Card 1 */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold mb-4">
                        <Tag size={12} /> LIMITED TIME
                    </div>
                    <h3 className="text-3xl font-black mb-2">20% OFF</h3>
                    <p className="text-white/90 font-medium mb-6">Get 20% off your first booking at any luxury lodge in Livingstone.</p>
                    <button className="px-6 py-3 bg-white text-pink-600 rounded-xl font-bold text-sm hover:bg-pink-50 transition-colors">
                        Claim Offer
                    </button>
                </div>
            </div>

             {/* Promo Card 2 */}
             <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600 mb-4">
                        <Tag size={12} /> WEEKEND DEAL
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Free Breakfast</h3>
                    <p className="text-slate-500 font-medium mb-6">Enjoy complimentary breakfast when you book a weekend stay at participating hotels.</p>
                    <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors">
                        View Hotels
                    </button>
                </div>
            </div>
        </div>

        <div className="mt-12 text-center">
            <p className="text-slate-400 text-sm">More promotions coming soon. Check back later!</p>
        </div>

      </main>
      <GuestBottomNav />
    </div>
  );
}
