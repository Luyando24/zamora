'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, User, Globe, Building2, Tent, ShoppingBag, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface GuestNavbarProps {
  cartCount?: number;
  onCartClick?: () => void;
}

export default function GuestNavbar({ cartCount, onCartClick }: GuestNavbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Tabs Configuration
  const tabs = [
    { name: 'Accommodation', icon: Building2 },
    { name: 'Activities', icon: Tent },
    { name: 'Places', icon: ShoppingBag }, 
  ];

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 bg-white border-b border-slate-100 h-16 md:h-20 px-4 md:px-12 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 text-zambia-red hover:opacity-80 transition-opacity">
         <div className="w-7 h-7 md:w-8 md:h-8 bg-zambia-red rounded-lg flex items-center justify-center text-white font-black text-sm md:text-base">Z</div>
         <span className="text-xl font-bold tracking-tight text-zambia-red hidden md:block uppercase">ZAMORA</span>
      </Link>

      {/* Center Tabs - Navigation */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full hidden md:flex items-center gap-2">
         {tabs.map(tab => (
           <Link
             key={tab.name}
             href="/explore"
             className="relative h-full px-4 flex items-center gap-2 text-sm font-bold transition-colors text-slate-500 hover:text-slate-800 hover:bg-slate-50"
           >
             <div className="flex items-center gap-2">
                 <tab.icon size={20} className="text-slate-500" />
                 <span>{tab.name}</span>
             </div>
           </Link>
         ))}
      </div>

      {/* User Menu */}
      <div className="flex items-center gap-4">
         <Link href="/dashboard" className="text-sm font-bold hover:bg-slate-100 px-4 py-2 rounded-full transition-colors hidden md:block">
            List Your Property
         </Link>
         <button 
           className="p-3 hover:bg-slate-100 rounded-full transition-colors"
           onClick={() => toast('Language & Currency selection coming soon!', { icon: '🌍' })}
         >
            <Globe size={18} />
         </button>
         
         <div className="relative" ref={menuRef}>
            <button 
              className="flex items-center gap-2 border border-slate-300 rounded-full p-1 pl-3 hover:shadow-md transition-shadow"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
               <Menu size={18} />
               <div className="bg-slate-500 text-white rounded-full p-1">
                  <User size={18} fill="white" />
               </div>
            </button>

            {userMenuOpen && (
               <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
                  <Link href="/login" className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3 font-semibold text-slate-700">
                     <LogIn size={18} /> Log in
                  </Link>
                  <Link href="/signup" className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3 font-semibold text-slate-700">
                     <UserPlus size={18} /> Sign up
                  </Link>
                  <div className="h-px bg-slate-100 my-2"></div>
                  <Link href="/dashboard" className="px-4 py-3 hover:bg-slate-50 block text-sm text-slate-600">
                     List your property
                  </Link>
                  <Link href="#" className="px-4 py-3 hover:bg-slate-50 block text-sm text-slate-600">
                     Help Center
                  </Link>
               </div>
            )}
         </div>
      </div>
    </header>
  );
}
