'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { createClient } from '@/utils/supabase/client';
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'food' | 'bar';
  propertyId: string;
  onSuccess: () => void;
}

export default function ExcelImportModal({ isOpen, onClose, type, propertyId, onSuccess }: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setLogs([]);
    }
  };

  const downloadTemplate = () => {
    const headers = type === 'food' 
      ? ['Name', 'Category', 'Price', 'Description', 'Image URL'] 
      : ['Name', 'Category', 'Price', 'Description', 'Image URL', 'Volume/Size', 'Ingredients', 'Original Price', 'Discount Badge', 'Alcohol Info'];
    
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${type}-menu-template.xlsx`);
  };

  const processFile = async () => {
    if (!file) return;
    setUploading(true);
    setLogs(prev => [...prev, 'Reading file...']);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error('No data found in file');
      }

      setLogs(prev => [...prev, `Found ${jsonData.length} items. Starting import...`]);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData as any[]) {
        try {
          // Map fields based on type
          const payload: any = {
             name: row['Name'],
             category: row['Category'] || (type === 'food' ? 'Food' : 'Cocktails'),
             price: row['Price'],
             description: row['Description'] || '',
             image_url: row['Image URL'] || '',
             created_by: user.id,
             is_available: true
          };

          if (!payload.name || !payload.price) {
            console.warn('Skipping invalid row:', row);
            errorCount++;
            continue;
          }

          if (type === 'bar') {
            payload.weight = row['Volume/Size'] || '';
            payload.ingredients = row['Ingredients'] || '';
            payload.original_price = row['Original Price'] || null;
            payload.discount_badge = row['Discount Badge'] || '';
            payload.dietary_info = row['Alcohol Info'] || '';
          }

          // Insert Item
          const tableName = type === 'food' ? 'menu_items' : 'bar_menu_items';
          const { data: newItem, error: insertError } = await supabase
            .from(tableName)
            .insert(payload)
            .select()
            .single();

          if (insertError) throw insertError;

          // Link to Property
          const junctionTable = type === 'food' ? 'menu_item_properties' : 'bar_menu_item_properties';
          const { error: linkError } = await supabase
            .from(junctionTable)
            .insert({
              menu_item_id: newItem.id,
              property_id: propertyId
            });

          if (linkError) throw linkError;

          successCount++;
        } catch (err) {
          console.error('Row error:', err);
          errorCount++;
        }
      }

      setLogs(prev => [...prev, `Completed! Success: ${successCount}, Failed: ${errorCount}`]);
      if (successCount > 0) {
        setTimeout(() => {
            onSuccess();
            onClose();
        }, 1500);
      }
    } catch (error: any) {
      setLogs(prev => [...prev, `Error: ${error.message}`]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="text-green-600" size={24} />
            Import {type === 'food' ? 'Menu' : 'Bar'} Items
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* 1. Template Download */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">1. Download Template</h3>
            <p className="text-xs text-slate-500 mb-3">Use this template to format your menu items correctly.</p>
            <button 
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Download size={16} />
              Download Excel Template
            </button>
          </div>

          {/* 2. Upload */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">2. Upload Excel File</h3>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                file ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-primary/40 hover:bg-slate-50'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".xlsx, .xls" 
                className="hidden" 
              />
              {file ? (
                <div className="text-center">
                  <FileSpreadsheet className="mx-auto text-green-600 mb-2" size={32} />
                  <p className="text-sm font-medium text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                  <p className="text-sm font-medium text-slate-600">Click to upload</p>
                  <p className="text-xs text-slate-400 mt-1">XLSX or XLS files</p>
                </div>
              )}
            </div>
          </div>

          {/* Logs */}
          {logs.length > 0 && (
            <div className="bg-slate-900 rounded-xl p-4 max-h-32 overflow-y-auto">
              {logs.map((log, i) => (
                <p key={i} className="text-xs font-mono text-slate-300 mb-1 last:mb-0">
                  {log}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button 
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={processFile}
            disabled={!file || uploading}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Start Import
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
