'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Building2, Plus, ExternalLink, MoreVertical, Eye, Edit, Trash2, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch permitted properties via RLS
    // We let RLS decide what we see: owned, assigned, or super admin access
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
        // eslint-disable-next-line no-console
        const errorMessage = error.message || (typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error));
        console.error('Error fetching properties:', errorMessage);
        setProperties([]);
      } else {
      if (data) setProperties(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) return;
    
    setDeletingId(id);
    const { error } = await supabase.from('properties').delete().eq('id', id);
    
    if (error) {
      alert('Error deleting property: ' + error.message);
    } else {
      setProperties(properties.filter(p => p.id !== id));
      // If the deleted property was the active one, we might want to clear it from metadata, 
      // but let's leave that complexity for now.
    }
    setDeletingId(null);
  };

  const handleSwitchProperty = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { property_id: id }
    });

    if (error) {
      alert('Error switching property');
    } else {
      // Also update profile for persistence
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ property_id: id }).eq('id', user.id);
      }
      router.push('/dashboard');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Properties</h1>
          <p className="text-slate-500">Manage your property listings.</p>
        </div>
        <Link href="/dashboard/setup" className="px-4 py-2 bg-zambia-green text-white rounded-lg hover:bg-green-700 font-medium shadow-sm flex items-center gap-2">
          <Plus size={18} />
          Add Property
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Property Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading properties...</td></tr>
            ) : properties.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No properties found. Add one to get started.</td></tr>
            ) : (
              properties.map((property) => (
                <tr key={property.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{property.name}</p>
                        <p className="text-xs text-slate-500">ID: {property.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-slate-700">{property.type || 'Hotel'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700 truncate max-w-[200px]">{property.address || 'No address'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      property.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        property.subscription_status === 'active' ? 'bg-green-600' : 'bg-yellow-600'
                      }`}></span>
                      {property.subscription_status || 'Trial'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleSwitchProperty(property.id)}
                        className="p-2 text-slate-400 hover:text-zambia-green hover:bg-green-50 rounded-lg transition-colors"
                        title="Switch Dashboard to this Property"
                      >
                        <LayoutDashboard size={18} />
                      </button>
                      <Link 
                        href={`/book/${property.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                        title="View Public Page"
                      >
                        <ExternalLink size={18} />
                      </Link>
                      <Link 
                        href={`/dashboard/properties/${property.id}`}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link 
                        href={`/dashboard/properties/${property.id}/edit`}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Property"
                      >
                        <Edit size={18} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(property.id)}
                        disabled={deletingId === property.id}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Property"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
