'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, User, ShoppingBag, LogIn, UserPlus, LogOut, MessageSquare, Map, Heart, UserCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

interface GuestNavbarProps {
  cartCount?: number;
  onCartClick?: () => void;
}

export default function GuestNavbar({ cartCount, onCartClick }: GuestNavbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Sync search input with URL params
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      } else {
        params.delete('q');
      }
      router.push(`/explore?${params.toString()}`);
    }
  };
  
  useEffect(() => {
    // Check auth status
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkAuth();

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    toast.success('Logged out successfully');
    router.refresh();
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white border-b border-slate-100 h-16 md:h-20 px-4 md:px-12 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
         <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-pink-400 flex items-center justify-center font-bold text-xl shadow-lg shadow-pink-600/20 text-white">Z</div>
         <span className="text-2xl font-bold tracking-tight text-black uppercase">ZAMORA</span>
      </Link>

      {/* Center Search Bar */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block w-full max-w-lg">
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search for stays, experiences, or places..."
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-full leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-100 focus:border-slate-300 sm:text-sm shadow-sm transition-all duration-200"
            />
        </div>
      </div>

      {/* User Menu */}
      <div className="flex items-center gap-4">
         <Link href="/dashboard" className="text-sm font-bold hover:bg-slate-100 px-4 py-2 rounded-full transition-colors hidden md:block">
            List Your Property
         </Link>
         
         {onCartClick && (
            <button 
                onClick={onCartClick}
                className="relative p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-900"
            >
                <ShoppingBag size={20} />
                {cartCount !== undefined && cartCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                        {cartCount}
                    </span>
                )}
            </button>
         )}

         
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
                  {user ? (
                    <>
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                           {user.user_metadata?.first_name 
                              ? `Hi, ${user.user_metadata.first_name}` 
                              : user.email}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      
                      <Link href="/messages" className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3 font-semibold text-slate-700">
                         <MessageSquare size={18} /> Messages
                      </Link>
                      <Link href="/trips" className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3 font-semibold text-slate-700">
                         <Map size={18} /> Trips
                      </Link>
                      <Link href="/wishlists" className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3 font-semibold text-slate-700">
                         <Heart size={18} /> Wishlists
                      </Link>
                      <Link href="/account" className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3 font-semibold text-slate-700">
                         <UserCircle size={18} /> Account
                      </Link>
                      <div className="h-px bg-slate-100 my-2"></div>
                      <Link href="/dashboard" className="px-4 py-3 hover:bg-slate-50 block text-sm text-slate-600">
                         List your property
                      </Link>
                      <Link href="#" className="px-4 py-3 hover:bg-slate-50 block text-sm text-slate-600">
                         Help Center
                      </Link>
                      <div className="h-px bg-slate-100 my-2"></div>
                      <button 
                         onClick={handleLogout}
                         className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 font-semibold text-red-600"
                      >
                         <LogOut size={18} /> Log out
                      </button>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
               </div>
            )}
         </div>
      </div>
    </header>
  );
}
