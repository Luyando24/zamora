'use client';
import { useState } from 'react';
import { useERP } from '@/hooks/useERP';
import { useProperty } from '../context/PropertyContext';
import { Plus, Search, Truck, Phone, Mail, MapPin } from 'lucide-react';
import SupplierModal from '@/components/dashboard/erp/SupplierModal';

export default function SuppliersPage() {
  const { selectedPropertyId } = useProperty();
  const { suppliers, loading, refetch } = useERP(selectedPropertyId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
         <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-medium">Loading suppliers...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Suppliers</h2>
          <p className="text-slate-500 text-sm">Manage your vendors and supply chain.</p>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input
               type="text"
               placeholder="Search suppliers..."
               className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>
           <button
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg shadow-slate-900/10"
           >
             <Plus size={16} /> Add Supplier
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{supplier.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{supplier.contact_name || 'No contact'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-slate-600">
              {supplier.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" />
                  <a href={`mailto:${supplier.email}`} className="hover:text-blue-600">{supplier.email}</a>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  <span className="truncate">{supplier.address}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredSuppliers.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <Truck size={24} className="text-slate-400" />
            </div>
            <h3 className="text-slate-900 font-medium">No suppliers found</h3>
            <p className="text-slate-500 text-sm mt-1">Get started by adding your first supplier.</p>
          </div>
        )}
      </div>

      <SupplierModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        propertyId={selectedPropertyId || ''}
        onSuccess={refetch}
      />
    </div>
  );
}
