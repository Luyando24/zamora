'use client';

import { useEffect, useState } from 'react';
import { useFolio, Folio } from '@/hooks/useFolio';
import FolioActions from '@/components/dashboard/FolioActions';
import { ArrowLeft, Printer, QrCode } from 'lucide-react';
import Link from 'next/link';
import { useProperty } from '../../../context/PropertyContext';

export default function FolioPage({ params }: { params: { id: string } }) {
  const { selectedPropertyId } = useProperty();
  const [folio, setFolio] = useState<Folio | null>(null);
  const { fetchFolio, addCharge } = useFolio(params.id, selectedPropertyId);

  const loadData = async () => {
    try {
      const data = await fetchFolio();
      setFolio(data);
    } catch (error) {
      console.error('Error loading folio:', error);
      // Optional: Redirect or show error UI
      alert('Error: ' + (error as Error).message);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
        loadData();
    }
  }, [params.id, selectedPropertyId]);

  if (!selectedPropertyId) return <div className="p-8">Loading Property...</div>;
  if (!folio) return <div className="p-8">Loading Folio...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventory" className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Guest Folio</h1>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Printer size={18} /> Print
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Invoice View */}
        <div className="md:col-span-2 bg-white shadow rounded-lg overflow-hidden border border-gray-200">
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice #</p>
              <p className="font-mono text-lg">{folio.zra_invoice_number || 'DRAFT'}</p>
            </div>
            {folio.zra_mark_id && (
               <div className="text-right">
                 <p className="text-xs font-bold text-zambia-green uppercase tracking-wider">ZRA Approved</p>
                 <p className="font-mono text-sm">{folio.zra_mark_id}</p>
               </div>
            )}
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-white">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount (ZMW)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {folio.folio_items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.total_price.toFixed(2)}</td>
                </tr>
              ))}
              {folio.folio_items.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-gray-400">No charges yet.</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">Total</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                  K {folio.total_amount?.toFixed(2) || '0.00'}
                </td>
              </tr>
            </tfoot>
          </table>

          {folio.zra_qr_code && (
            <div className="p-6 border-t border-gray-200 flex flex-col items-center justify-center text-center bg-gray-50/50">
              <div className="h-32 w-32 bg-white p-2 border rounded-lg shadow-sm mb-2 flex items-center justify-center">
                 {/* In real app, use a QRCode component. For now, a placeholder icon */}
                 <QrCode size={64} className="text-gray-800" />
              </div>
              <p className="text-xs text-gray-500 max-w-xs break-all">{folio.zra_qr_code}</p>
              <p className="text-xs text-gray-400 mt-1">Scan to verify with ZRA</p>
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
