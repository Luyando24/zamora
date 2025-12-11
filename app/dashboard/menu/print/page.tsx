'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useMenuCategories } from '@/hooks/useMenuCategories';
import { Loader2, Printer } from 'lucide-react';
import Image from 'next/image';

interface PrintMenuPageProps {
  params: {
    propertyId: string;
  };
  searchParams: {
    propertyId?: string; // Fallback
  };
}

export default function PrintMenuPage({ searchParams }: { searchParams: { propertyId: string } }) {
  const propertyId = searchParams.propertyId;
  const [items, setItems] = useState<any[]>([]);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      if (!propertyId || propertyId === 'all') {
        // If no specific property, maybe fetch user profile or just items? 
        // For print view, it's best to be property specific, but we can handle generic.
      }

      // 1. Fetch Property Details
      if (propertyId && propertyId !== 'all') {
        const { data: prop } = await supabase.from('properties').select('*').eq('id', propertyId).single();
        if (prop) setProperty(prop);
      }

      // 2. Fetch Items
      let query = supabase.from('menu_items').select('*').eq('is_available', true);
      
      if (propertyId && propertyId !== 'all') {
        // We need to join with menu_item_properties
        const { data: assignments } = await supabase
            .from('menu_item_properties')
            .select('menu_item_id')
            .eq('property_id', propertyId);
        
        const ids = assignments?.map(a => a.menu_item_id) || [];
        if (ids.length > 0) {
            query = query.in('id', ids);
        } else {
            setItems([]);
            setLoading(false);
            return;
        }
      }

      const { data: menuItems, error } = await query;
      if (menuItems) {
        setItems(menuItems);
      }
      setLoading(false);
    };

    fetchData();
  }, [propertyId]);

  // Group items by category
  const grouped = items.reduce((acc: any, item: any) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-slate-300" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans selection:bg-black selection:text-white print:p-0 p-8">
      {/* Print Controls (Hidden when printing) */}
      <div className="fixed top-6 right-6 print:hidden z-50">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-bold shadow-xl hover:scale-105 transition-transform"
        >
          <Printer size={18} /> Print Menu
        </button>
      </div>

      {/* A4 Container */}
      <div className="max-w-[210mm] mx-auto bg-white print:max-w-none">
        
        {/* COVER SECTION */}
        <header className="mb-16 text-center pt-12 print:pt-0">
          <div className="mb-8 flex justify-center">
            {property?.logo_url ? (
               <img src={property.logo_url} alt="Logo" className="h-24 w-auto object-contain grayscale" />
            ) : (
               <div className="h-20 w-20 border-2 border-slate-900 rounded-full flex items-center justify-center">
                  <span className="font-black text-2xl tracking-tighter">ZM</span>
               </div>
            )}
          </div>
          
          <h1 className="text-5xl font-black uppercase tracking-[0.2em] mb-4 text-slate-900">
            {property?.name || 'Menu'}
          </h1>
          <div className="w-24 h-1 bg-black mx-auto mb-6"></div>
          <p className="text-slate-500 uppercase tracking-widest text-sm font-medium">
            Exquisite Dining Experience
          </p>
        </header>

        {/* MENU GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 print:grid-cols-2 print:gap-x-12">
          {categories.map((cat) => (
            <section key={cat} className="break-inside-avoid">
              <h2 className="text-2xl font-black uppercase tracking-wider mb-8 flex items-center gap-4">
                <span className="text-slate-900">{cat}</span>
                <span className="h-[1px] flex-1 bg-slate-200"></span>
              </h2>

              <div className="space-y-8">
                {grouped[cat].map((item: any) => (
                  <div key={item.id} className="group flex justify-between items-baseline gap-4">
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between mb-1">
                        <h3 className="font-bold text-lg text-slate-900 uppercase tracking-tight">
                          {item.name}
                        </h3>
                      </div>
                      <p className="text-slate-500 text-sm font-light leading-relaxed pr-4">
                        {item.description}
                      </p>
                      {item.dietary_info && (
                          <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-200 px-1.5 rounded-sm">
                              {item.dietary_info}
                          </span>
                      )}
                    </div>
                    
                    <div className="text-right">
                        <span className="text-lg font-bold text-slate-900 tabular-nums">
                            {/* Format Price cleanly */}
                            <span className="text-sm font-normal align-top mr-0.5">K</span>
                            {item.price}
                        </span>
                        {item.weight && (
                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mt-0.5">
                                {item.weight}
                            </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* FOOTER */}
        <footer className="mt-24 pt-8 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 uppercase tracking-widest print:fixed print:bottom-8 print:left-0 print:right-0 print:px-12 print:border-none">
          <span>{property?.name || 'Fine Dining'}</span>
          <span>Powered by Zamora</span>
        </footer>
      </div>

      {/* CSS for Print */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 15mm;
            size: A4;
          }
          body {
            background: white;
            color: black;
          }
          /* Ensure backgrounds print if user enabled them, but we kept it minimal */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
