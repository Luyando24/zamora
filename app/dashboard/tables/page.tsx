'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useProperty } from '../context/PropertyContext';
import Modal from '@/components/ui/Modal';
import { Plus, Edit, Trash2, AlertTriangle, LayoutGrid, List, Utensils, QrCode, Loader2, Layers } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QRCodeDisplay from './components/QRCodeDisplay';
import BulkCreateTableModal from './components/BulkCreateTableModal';

interface TableType {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
}

interface Table {
  id: string;
  room_number: string; // Used as table_number
  room_type_id: string;
  status: string;
  notes: string | null;
  room_types?: {
    name: string;
    category: string;
  };
  property_id: string;
}

export default function TablesPage() {
  const { selectedPropertyId } = useProperty();
  const [activeTab, setActiveTab] = useState<'tables' | 'types'>('tables');
  const supabase = createClient();
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const router = useRouter();
  
  // Data State
  const [tables, setTables] = useState<Table[]>([]);
  const [tableTypes, setTableTypes] = useState<TableType[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Table | null>(null);
  
  // New Table Form
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableTypeId, setNewTableTypeId] = useState('');

  // QR Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedTableForQr, setSelectedTableForQr] = useState<Table | null>(null);

  const fetchData = useCallback(async () => {
    if (!selectedPropertyId) return;
    setLoading(true);
    
    // Fetch Tables (rooms with room_type.category = 'table')
    const { data: tData } = await supabase
      .from('rooms')
      .select('*, room_types!inner(name, category)')
      .eq('property_id', selectedPropertyId)
      .eq('room_types.category', 'table')
      .order('room_number', { ascending: true });
      
    // Fetch Table Types
    const { data: ttData } = await supabase
      .from('room_types')
      .select('*')
      .eq('property_id', selectedPropertyId)
      .eq('category', 'table')
      .order('name');
    
    if (tData) setTables(tData);
    if (ttData) setTableTypes(ttData);
    setLoading(false);
  }, [selectedPropertyId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddClick = (type: 'type' | 'unit') => {
    if (!selectedPropertyId) {
      setIsWarningOpen(true);
      return;
    }

    if (type === 'type') {
      router.push('/dashboard/tables/types/new');
    } else {
      setEditItem(null);
      setNewTableNumber('');
      setNewTableTypeId(tableTypes[0]?.id || '');
      setIsModalOpen(true);
    }
  };

  const handleSaveTable = async () => {
    if (!selectedPropertyId || !newTableNumber || !newTableTypeId) return;

    try {
      if (editItem) {
        // Update
        const { error } = await supabase
          .from('rooms')
          .update({
            room_number: newTableNumber,
            room_type_id: newTableTypeId,
          })
          .eq('id', editItem.id);
          
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('rooms')
          .insert({
            property_id: selectedPropertyId,
            room_number: newTableNumber,
            room_type_id: newTableTypeId,
            status: 'clean', // Default status
          });
          
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      if (error.code === '23505' || error.message?.includes('rooms_hotel_id_room_number_key')) {
        alert('Error: This table number already exists. Please choose a unique number.');
      } else {
        alert('Error saving table: ' + error.message);
      }
    }
  };

  const handleDelete = async (id: string, table: 'rooms' | 'room_types') => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      alert('Error deleting item: ' + error.message);
    } else {
      fetchData();
    }
  };

  const openQrModal = (table: Table) => {
    setSelectedTableForQr(table);
    setQrModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Table Management</h1>
          <p className="text-slate-500">Manage your restaurant tables, types, and QR codes.</p>
        </div>
        
        <div className="flex gap-2">
            <div className="bg-white border border-slate-200 p-1 rounded-lg flex">
                <button 
                    onClick={() => setActiveTab('tables')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'tables' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <LayoutGrid size={16} />
                    Tables
                </button>
                <button 
                    onClick={() => setActiveTab('types')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'types' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <List size={16} />
                    Types
                </button>
            </div>
            <button 
                onClick={() => handleAddClick(activeTab === 'tables' ? 'unit' : 'type')}
                className="bg-blue-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-sm"
            >
                <Plus size={18} />
                Add {activeTab === 'tables' ? 'Table' : 'Type'}
            </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-slate-300" size={32} />
        </div>
      ) : (
        <>
            {activeTab === 'tables' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {tables.map(table => (
                        <div key={table.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group relative">
                            <div className="flex justify-between items-start mb-2">
                                <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                                    {table.room_types?.name || 'Table'}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => openQrModal(table)}
                                        className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900"
                                        title="QR Code"
                                    >
                                        <QrCode size={14} />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setEditItem(table);
                                            setNewTableNumber(table.room_number);
                                            setNewTableTypeId(table.room_type_id);
                                            setIsModalOpen(true);
                                        }}
                                        className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(table.id, 'rooms')}
                                        className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-center py-4">
                                <h3 className="text-3xl font-black text-slate-900">{table.room_number}</h3>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">Table Number</p>
                            </div>
                        </div>
                    ))}
                            {tables.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <Utensils className="mx-auto mb-3 opacity-20" size={48} />
                            <p>No tables found. Add your first table to get started.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Type Name</th>
                                <th className="px-6 py-4">Capacity</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tableTypes.map(type => (
                                <tr key={type.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900">{type.name}</td>
                                    <td className="px-6 py-4 text-slate-600">{type.capacity} Pax</td>
                                    <td className="px-6 py-4 text-slate-500 text-sm truncate max-w-xs">{type.description || '-'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleDelete(type.id, 'room_types')}
                                            className="text-red-400 hover:text-red-600 font-bold text-sm"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {tableTypes.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        No table types found. Create types like &quot;Indoor&quot; or &quot;Outdoor&quot;.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </>
      )}

      {/* Add/Edit Table Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editItem ? "Edit Table" : "Add New Table"}
      >
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Table Number</label>
                <input 
                    type="text" 
                    placeholder="e.g. 1, 2, A1, B2"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 text-slate-900"
                    value={newTableNumber}
                    onChange={e => setNewTableNumber(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Table Type</label>
                <select 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 text-slate-900"
                    value={newTableTypeId}
                    onChange={e => setNewTableTypeId(e.target.value)}
                >
                    <option value="" disabled>Select a type</option>
                    {tableTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.capacity} pax)</option>
                    ))}
                </select>
                {tableTypes.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Please create a table type first.</p>
                )}
            </div>
            <div className="pt-4 flex justify-end gap-2">
                <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSaveTable}
                    className="px-6 py-2 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
                >
                    Save Table
                </button>
            </div>
        </div>
      </Modal>

      {/* Bulk Add Modal */}
      {selectedPropertyId && (
        <BulkCreateTableModal
            isOpen={isBulkModalOpen}
            onClose={() => setIsBulkModalOpen(false)}
            propertyId={selectedPropertyId}
            tableTypes={tableTypes}
            onSuccess={() => {
                fetchData();
                setIsBulkModalOpen(false);
            }}
        />
      )}

      {/* QR Code Modal */}
      {selectedTableForQr && selectedPropertyId && (
        <QRCodeDisplay 
            isOpen={qrModalOpen}
            onClose={() => setQrModalOpen(false)}
            tableNumber={selectedTableForQr.room_number}
            tableType={selectedTableForQr.room_types?.name}
            propertyId={selectedPropertyId}
        />
      )}

      {/* Warning Modal */}
      <Modal
        isOpen={isWarningOpen}
        onClose={() => setIsWarningOpen(false)}
        title="No Property Selected"
      >
        <div className="text-center space-y-4">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-orange-600">
                <AlertTriangle size={32} />
            </div>
            <p className="text-slate-600">
                You need to select a property context to manage tables.
                Please ensure you have selected a property in the sidebar or setup a property first.
            </p>
            <button 
                onClick={() => setIsWarningOpen(false)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold"
            >
                Understood
            </button>
        </div>
      </Modal>
    </div>
  );
}
