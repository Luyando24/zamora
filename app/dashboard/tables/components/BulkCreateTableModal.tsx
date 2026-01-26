'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2, AlertTriangle, Check, Info } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface TableType {
  id: string;
  name: string;
}

interface BulkCreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  tableTypes: TableType[];
  onSuccess: () => void;
}

export default function BulkCreateTableModal({ 
  isOpen, 
  onClose, 
  propertyId, 
  tableTypes, 
  onSuccess 
}: BulkCreateTableModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [inputString, setInputString] = useState('');
  const [prefix, setPrefix] = useState('');
  const [preview, setPreview] = useState<string[]>([]);
  const [error, setError] = useState('');
  const supabase = createClient();

  // Parse input string into array of table numbers
  const parseTableNumbers = (input: string, prefixStr: string): string[] => {
    const result: Set<string> = new Set();
    const parts = input.split(',').map(p => p.trim()).filter(Boolean);

    for (const part of parts) {
      if (part.includes('-')) {
        // Range: 1-10
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          // Limit range size to prevent abuse/crashes
          if (end - start > 100) continue; 
          for (let i = start; i <= end; i++) {
            result.add(`${prefixStr}${i}`);
          }
        }
      } else {
        // Single: 1
        result.add(`${prefixStr}${part}`);
      }
    }
    
    // Sort logically (alphanumeric)
    return Array.from(result).sort((a, b) => {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  };

  const handleInputChange = (val: string, pref: string) => {
    setInputString(val);
    setPrefix(pref);
    const parsed = parseTableNumbers(val, pref);
    setPreview(parsed);
  };

  const handleSubmit = async () => {
    if (!selectedTypeId) {
      setError('Please select a table type.');
      return;
    }
    if (preview.length === 0) {
      setError('Please enter valid table numbers.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Check for existing tables to avoid duplicates (optional, or let DB fail)
      // For better UX, we'll just try to insert and ignore conflicts or warn?
      // Supabase insert doesn't support "ON CONFLICT DO NOTHING" easily via JS client without setup.
      // Let's check first.
      
      const { data: existing } = await supabase
        .from('rooms')
        .select('room_number')
        .eq('property_id', propertyId)
        .in('room_number', preview);

      if (existing && existing.length > 0) {
        const existingNums = existing.map(r => r.room_number);
        if (!confirm(`The following tables already exist and will be skipped: ${existingNums.join(', ')}. Continue?`)) {
            setLoading(false);
            return;
        }
        // Filter out existing
        const newTables = preview.filter(num => !existingNums.includes(num));
        if (newTables.length === 0) {
            setError('All tables already exist.');
            setLoading(false);
            return;
        }
        await insertTables(newTables);
      } else {
        await insertTables(preview);
      }

    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('rooms_hotel_id_room_number_key')) {
         setError('One or more table numbers already exist. Please check your list for duplicates.');
      } else {
         setError(err.message);
      }
      setLoading(false);
    }
  };

  const insertTables = async (numbers: string[]) => {
    const { error } = await supabase.from('rooms').insert(
        numbers.map(num => ({
            property_id: propertyId,
            room_number: num,
            room_type_id: selectedTypeId,
            status: 'available'
        }))
    );

    if (error) throw error;
    
    onSuccess();
    onClose();
    // Reset form
    setInputString('');
    setPreview([]);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Add Tables">
      <div className="space-y-6">
        
        {/* Type Selection */}
        <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Table Type <span className="text-red-500">*</span></label>
            <select 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 text-slate-900"
                value={selectedTypeId}
                onChange={e => setSelectedTypeId(e.target.value)}
            >
                <option value="" disabled>Select a type</option>
                {tableTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>
        </div>

        {/* Input */}
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-slate-700">Table Numbers <span className="text-red-500">*</span></label>
                <span className="text-xs text-slate-500">e.g. 1-10, 12, 15-20</span>
            </div>
            <div className="flex gap-2 mb-2">
                 <input 
                    type="text" 
                    placeholder="Prefix (opt)" 
                    className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 text-slate-900"
                    value={prefix}
                    onChange={e => handleInputChange(inputString, e.target.value)}
                 />
                 <input 
                    type="text" 
                    placeholder="Range or list (e.g. 1-20)" 
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 text-slate-900"
                    value={inputString}
                    onChange={e => handleInputChange(e.target.value, prefix)}
                 />
            </div>
            <p className="text-xs text-slate-400">
                Use commas for lists (1, 2) and hyphens for ranges (1-10).
            </p>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 max-h-40 overflow-y-auto">
                <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <Info size={12} />
                    <span>Preview ({preview.length} Tables)</span>
                </div>
                <div className="flex flex-wrap gap-1">
                    {preview.map(num => (
                        <span key={num} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700">
                            {num}
                        </span>
                    ))}
                </div>
            </div>
        )}

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
            </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg"
            >
                Cancel
            </button>
            <button 
                onClick={handleSubmit}
                disabled={loading || preview.length === 0 || !selectedTypeId}
                className="px-6 py-2 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2"
            >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Create {preview.length} Tables
            </button>
        </div>
      </div>
    </Modal>
  );
}
