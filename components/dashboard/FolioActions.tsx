'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface FolioActionsProps {
  folioId: string;
  status: string;
  onChargeAdded: () => void;
  onFiscalized: () => void;
  addChargeFn: (folioId: string, desc: string, amount: number) => Promise<void>;
}

export default function FolioActions({ folioId, status, onChargeAdded, onFiscalized, addChargeFn }: FolioActionsProps) {
  const [isCharging, setIsCharging] = useState(false);
  const [isFiscalizing, setIsFiscalizing] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');

  const handleAddCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    setIsCharging(true);
    try {
      await addChargeFn(folioId, desc, parseFloat(amount));
      setDesc('');
      setAmount('');
      onChargeAdded();
    } catch (error) {
      alert('Failed to add charge');
    } finally {
      setIsCharging(false);
    }
  };

  const handleFiscalize = async () => {
    if (!confirm('Are you sure? This will submit to ZRA and finalize the invoice.')) return;

    setIsFiscalizing(true);
    try {
      const res = await fetch('/api/zra/submit-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folioId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert('Fiscalization Successful!');
      onFiscalized();
    } catch (error: any) {
      alert(`Fiscalization Failed: ${error.message}`);
    } finally {
      setIsFiscalizing(false);
    }
  };

  if (status === 'paid') {
    return <div className="p-4 bg-green-100 text-green-800 rounded-lg text-center font-bold">Invoice Closed & Fiscalized</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add Charge Form */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3">Add Charge</h3>
        <form onSubmit={handleAddCharge} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Description (e.g. Coca Cola)" 
            className="flex-1 rounded-md border-gray-300 shadow-sm px-3 py-2 border"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <input 
            type="number" 
            placeholder="Amount" 
            className="w-24 rounded-md border-gray-300 shadow-sm px-3 py-2 border"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={isCharging}
            className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {isCharging ? '...' : 'Add'}
          </button>
        </form>
      </div>

      {/* Finalize Button */}
      <button
        onClick={handleFiscalize}
        disabled={isFiscalizing}
        className="w-full py-4 bg-zambia-green text-white text-lg font-bold rounded-lg shadow-lg hover:bg-zambia-green/90 flex justify-center items-center gap-2"
      >
        {isFiscalizing && <Loader2 className="animate-spin" />}
        {isFiscalizing ? 'Fiscalizing with ZRA...' : 'Finalize & Fiscalize Invoice'}
      </button>
    </div>
  );
}
