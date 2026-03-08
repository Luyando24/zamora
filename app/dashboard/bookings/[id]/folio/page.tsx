'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFolio, Folio } from '@/hooks/useFolio';
import FolioActions from '@/components/dashboard/FolioActions';
import { ArrowLeft, Printer, QrCode } from 'lucide-react';
import Link from 'next/link';
import { useProperty } from '../../../context/PropertyContext';

export default function FolioPage({ params }: { params: { id: string } }) {
  const { selectedPropertyId } = useProperty();
  const [folio, setFolio] = useState<Folio | null>(null);
  const { fetchFolio, addCharge } = useFolio(params.id, selectedPropertyId);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchFolio();
      setFolio(data);
    } catch (error) {
      console.error('Error loading folio:', error);
      // Optional: Redirect or show error UI
      alert('Error: ' + (error as Error).message);
    }
  }, [fetchFolio]);

  useEffect(() => {
    if (selectedPropertyId) {
        loadData();
    }
  }, [params.id, selectedPropertyId, loadData]);

  if (!selectedPropertyId) return <div className="p-8">Loading Property...</div>;
  if (!folio) return <div className="p-8">Loading Folio...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventory" className="p-2 hover:bg-primary/5 hover:text-primary rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Guest Folio</h1>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-primary/5 hover:text-primary rounded-lg transition-colors font-medium"
        >
          <Printer size={18} /> Print
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Invoice View */}
        <div className="md:col-span-2 bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice #</p>
              <p className="font-mono text-lg text-slate-700">{folio.zra_invoice_number || 'DRAFT'}</p>
            </div>
            {folio.zra_mark_id && (
               <div className="text-right">
                 <p className="text-[10px] font-bold text-primary uppercase tracking-widest">ZRA Approved</p>
                 <p className="font-mono text-sm text-slate-600">{folio.zra_mark_id}</p>
               </div>
            )}
          </div>

          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-white">
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount (ZMW)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {folio.folio_items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-700">{item.description}</td>
                  <td className="px-6 py-4 text-sm text-slate-900 text-right font-medium">{item.total_price.toFixed(2)}</td>
                </tr>
              ))}
              {folio.folio_items.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-slate-400 italic">No charges yet.</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50/80">
              <tr>
                <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right uppercase tracking-wider">Total</td>
                <td className="px-6 py-4 text-lg font-bold text-primary text-right">
                  K {folio.total_amount?.toFixed(2) || '0.00'}
                </td>
              </tr>
            </tfoot>
          </table>

          {folio.zra_qr_code && (
            <div className="p-6 border-t border-slate-200 flex flex-col items-center justify-center text-center bg-slate-50/30">
              <div className="h-32 w-32 bg-white p-2 border border-slate-200 rounded-xl shadow-sm mb-3 flex items-center justify-center">
                 <QrCode size={64} className="text-slate-800" />
              </div>
              <p className="text-[10px] text-slate-400 max-w-xs break-all font-mono mb-1">{folio.zra_qr_code}</p>
              <p className="text-xs text-slate-500 font-medium">Scan to verify with ZRA</p>
            </div>
          )}
        </div>

        {/* Actions Sidebar */}
        <div>
          <FolioActions 
            folioId={folio.id} 
            status={folio.status} 
            onChargeAdded={loadData} 
            onFiscalized={loadData}
            addChargeFn={addCharge}
          />
        </div>
      </div>
    </div>
  );
}
