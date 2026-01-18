'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Search, Bell, User, Menu, X } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <AdminSidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden relative w-full">
        <header className="flex h-16 items-center justify-between bg-white px-4 md:px-6 shadow-sm z-10 border-b border-slate-200">
          
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Search Bar */}
            <div className="flex items-center flex-1 max-w-xl">
               <div className="relative w-full max-w-md hidden sm:block">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Search className="h-4 w-4 text-slate-400" />
                 </div>
                 <input
                   type="text"
                   className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                   placeholder="Search properties, users, or logs..."
                 />
               </div>
               {/* Mobile Search Icon */}
               <button className="sm:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                 <Search size={20} />
               </button>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-500 rounded-full hover:bg-slate-100 relative">
               <Bell size={20} />
               <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
            </button>
            <div className="h-8 w-1 border-r border-slate-200 mx-1 md:mx-2"></div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">Master Admin</p>
                <p className="text-xs text-slate-500">Zamora HQ</p>
              </div>
              <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-sm">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
