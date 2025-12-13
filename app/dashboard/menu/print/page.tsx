'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Printer, ChevronLeft, ChefHat, FileText } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function PrintMenuPage({ searchParams }: { searchParams: { propertyId: string } }) {
  const propertyId = searchParams.propertyId;
  const [items, setItems] = useState<any[]>([]);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const supabase = createClient();

  const handleExportPdf = async () => {
    const element = document.getElementById('menu-preview-container');
    if (!element) return;
    
    setIsExporting(true);
    try {
        const canvas = await html2canvas(element, {
            scale: 2, // Higher resolution
            backgroundColor: '#020617', // Match slate-950
            useCORS: true, // For images
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        // Calculate ratio to fit width
        const ratio = pdfWidth / imgWidth;
        const finalHeight = imgHeight * ratio;

        // If content is taller than one page, we might need multiple pages or just scale down?
        // For now, let's fit to width and let it overflow to next page if supported, or just one long image on one page?
        // jsPDF doesn't auto-split images. 
        // A simple approach for "Preview" is often a single page or just fit to width.
        // If it's very long, we might need to split.
        // But the preview container is "min-h-screen", usually one page worth of content for a menu card.
        // Let's assume it fits on one page or we just print what fits.
        
        // Better approach: If height > A4 height, add pages.
        let heightLeft = finalHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, finalHeight);
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
          position = heightLeft - finalHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, finalHeight);
          heightLeft -= pdfHeight;
        }

        pdf.save(`${(property?.name || 'Menu').replace(/[^a-zA-Z0-9]/g, '_')}_Preview.pdf`);
    } catch (error) {
        console.error('PDF Export failed', error);
        alert('Failed to generate PDF. Please try "Print Menu" instead.');
    } finally {
        setIsExporting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
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
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-pink-600" size={40} />
            <p className="text-slate-400 font-medium tracking-widest text-sm">DESIGNING MENU...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-sans selection:bg-pink-500 selection:text-white print:p-0 relative">
      
      {/* --- Screen-Only Controls --- */}
      <nav className="print:hidden sticky top-0 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-50 px-6 py-4 flex justify-between items-center">
        <Link href="/dashboard/menu" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">
            <ChevronLeft size={16} /> Back to Dashboard
        </Link>
        <div className="flex gap-3">
            <button
            onClick={() => handleExportPdf()}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-full font-bold hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-2.5 bg-pink-600 text-white rounded-full font-bold shadow-lg shadow-pink-900/20 hover:bg-pink-500 hover:scale-105 transition-all"
            >
            <Printer size={18} /> Print Menu
            </button>
        </div>
      </nav>

      {/* --- Printable Canvas --- */}
      {/* Using A4 dimensions max-width for screen preview, full width for print */}
      <div id="menu-preview-container" className="max-w-[210mm] mx-auto bg-slate-950 pt-12 pb-12 px-12 print:pt-0 print:px-0 print:max-w-none min-h-screen flex flex-col relative overflow-hidden">
        
        {/* Decorative Background Elements (Futuristic) */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-pink-900/10 to-transparent pointer-events-none print:hidden"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/5 rounded-full blur-3xl pointer-events-none print:hidden"></div>

        {/* Header */}
        <header className="text-center mb-16 print:mb-12 print:mt-12 relative z-10">
            <div className="inline-block mb-6 relative">
                {property?.logo_url ? (
                    <img src={property.logo_url} alt="Logo" className="h-24 w-auto object-contain brightness-0 invert" />
                ) : (
                    <div className="h-20 w-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-800 shadow-xl shadow-black/50">
                        <ChefHat className="text-pink-500" size={32} />
                    </div>
                )}
            </div>
            
            <h1 className="text-5xl font-black uppercase tracking-[0.2em] text-white mb-2 drop-shadow-sm">
                {property?.name || 'MENU'}
            </h1>
            <div className="flex items-center justify-center gap-4 text-xs font-bold tracking-[0.3em] text-pink-500 uppercase">
                <span>Est. 2024</span>
                <span className="w-1 h-1 bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)]"></span>
                <span>Fine Dining</span>
            </div>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16 print:grid-cols-2 print:gap-x-16 relative z-10">
            {categories.map((cat) => (
                <section key={cat} className="break-inside-avoid mb-8">
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-xl font-black uppercase tracking-widest text-white shrink-0 border-b-2 border-pink-600 pb-1">
                            {cat}
                        </h2>
                        <div className="h-[1px] bg-slate-800 flex-1"></div>
                    </div>

                    <div className="space-y-8">
                        {grouped[cat].map((item: any) => (
                            <div key={item.id} className="group relative pl-4 border-l border-slate-800 hover:border-pink-600 transition-colors duration-300">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-base text-slate-100 uppercase tracking-wide group-hover:text-pink-400 transition-colors print:text-slate-100">
                                        {item.name}
                                    </h3>
                                    <span className="shrink-0 ml-4 font-bold text-pink-500 text-lg tabular-nums drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]">
                                        <span className="text-xs font-medium mr-0.5 text-pink-400/70">K</span>
                                        {item.price}
                                    </span>
                                </div>
                                
                                <p className="text-slate-400 text-xs leading-relaxed font-medium pr-8 mb-2">
                                    {item.description}
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {item.weight && (
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider border border-slate-800 px-1.5 py-0.5 rounded-sm">
                                            {item.weight}
                                        </span>
                                    )}
                                    {item.dietary_info && (
                                        <span className="text-[9px] font-bold text-pink-400 uppercase tracking-wider border border-pink-900/30 bg-pink-900/10 px-1.5 py-0.5 rounded-sm">
                                            {item.dietary_info}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>

        {/* Footer */}
        <footer className="mt-auto pt-20 text-center print:fixed print:bottom-8 print:left-0 print:right-0 relative z-10">
            <div className="w-12 h-[2px] bg-pink-600 mx-auto mb-6"></div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-600 uppercase">
                {property?.name ? `${property.name} • ` : ''} Powered by Zamora
            </p>
        </footer>

      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 0; /* Minimal margin to allow full bleed if printer supports */
            size: A4;
          }
          body {
            background-color: #020617 !important; /* Slate 950 */
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Force background on the main container */
          .bg-slate-950 {
            background-color: #020617 !important;
          }
          /* Ensure text is white */
          .text-slate-100, .text-white {
            color: #f1f5f9 !important;
          }
          .text-slate-400 {
            color: #94a3b8 !important;
          }
          .border-slate-800 {
            border-color: #1e293b !important;
          }
          nav {
            display: none;
          }
          /* Add some padding back for the content inside the page */
          .max-w-\[210mm\] {
            padding: 15mm !important;
            min-height: 100vh;
          }
        }
      `}</style>
    </div>
  );
}
