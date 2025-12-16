'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useProperty } from '../context/PropertyContext';
import Modal from '@/components/ui/Modal';
import { Plus, Edit, Trash2, BedDouble, AlertTriangle, ArrowRight, LayoutGrid, List } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface RoomType {
  id: string;
  name: string;
  base_price: number;
  description: string | null;
  image_url: string | null;
  capacity: number;
}

interface Room {
  id: string;
  room_number: string;
  room_type_id: string;
  status: string;
  notes: string | null;
  room_types?: {
    name: string;
  };
  property_id: string;
}

export default function RoomsPage() {
  const { selectedPropertyId } = useProperty();
  const [activeTab, setActiveTab] = useState<'rooms' | 'types'>('types');
  const supabase = createClient();
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const router = useRouter();
  
  // Data State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State (Only for adding physical rooms now)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Room | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedPropertyId]);

  const fetchData = async () => {
    if (!selectedPropertyId) return;
    setLoading(true);
    
    const { data: rData } = await supabase
      .from('rooms')
      .select('*, room_types(name)')
      .eq('property_id', selectedPropertyId)
      .order('room_number');
      
    const { data: tData } = await supabase
      .from('room_types')
      .select('*')
      .eq('property_id', selectedPropertyId)
      .order('name');
    
    if (rData) setRooms(rData);
    if (tData) setRoomTypes(tData);
    setLoading(false);
  };

  const handleAddClick = (type: 'type' | 'unit') => {
    if (!selectedPropertyId) {
      setIsWarningOpen(true);
      return;
    }

    if (type === 'type') {
      router.push('/dashboard/rooms/types/new');
    } else {
      setEditItem(null);
      setIsModalOpen(true);
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

  // Content
  const SkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-slate-100 rounded-2xl h-64"></div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rooms Management</h1>
           <p className="text-slate-500 text-sm">Configure room types and physical units.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleAddClick('type')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-sm shadow-sm transition-all"
          >
            <Plus size={16} /> Add Type
          </button>
          <button
            onClick={() => handleAddClick('unit')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold text-sm shadow-lg shadow-slate-900/10 transition-all"
          >
            <Plus size={16} /> Add Room
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1">
           <button
             onClick={() => setActiveTab('types')}
             className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
               activeTab === 'types'
                 ? 'bg-white text-slate-900 shadow-sm'
                 : 'text-slate-500 hover:text-slate-700'
             }`}
           >
             <LayoutGrid size={16} />
             Room Types
           </button>
           <button
             onClick={() => setActiveTab('rooms')}
             className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
               activeTab === 'rooms'
                 ? 'bg-white text-slate-900 shadow-sm'
                 : 'text-slate-500 hover:text-slate-700'
             }`}
           >
             <List size={16} />
             Physical Rooms
           </button>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonGrid />
      ) : activeTab === 'types' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomTypes.map((type) => (
            <div key={type.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
              <div className="h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                 {type.image_url ? (
                   <img src={type.image_url} alt={type.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 ) : (
                   <BedDouble className="text-slate-300" size={48} />
                 )}
                 <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-slate-900 px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                   Capacity: {type.capacity}
                 </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-slate-900 text-lg">{type.name}</h3>
                   <p className="font-black text-slate-900">K{type.base_price}</p>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 flex-1 leading-relaxed">{type.description || 'No description provided.'}</p>
                
                <div className="mt-5 pt-4 border-t border-slate-50 flex justify-end gap-2">
                  <Link 
                    href={`/dashboard/rooms/types/${type.id}`}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </Link>
                  <button 
                    onClick={() => handleDelete(type.id, 'room_types')}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {roomTypes.length === 0 && (
             <div className="col-span-full text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
               No room types found. Create one to get started.
             </div>
          )}
        </div>
      ) : (
        <RoomsTable 
          rooms={rooms} 
          onEdit={(r) => { setEditItem(r); setIsModalOpen(true); }} 
          onDelete={(id) => handleDelete(id, 'rooms')} 
        />
      )}

      {/* Modal only for adding/editing physical rooms now */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${editItem ? 'Edit' : 'Add'} Room Unit`}
      >
        <RoomForm 
          key={editItem?.id || 'new-room'}
          initialData={editItem} 
          roomTypes={roomTypes}
          onSuccess={() => { setIsModalOpen(false); fetchData(); }} 
        />
      </Modal>

      {/* No Property Warning Modal */}
      <Modal
        isOpen={isWarningOpen}
        onClose={() => setIsWarningOpen(false)}
        title="Property Setup Required"
      >
        <div className="space-y-4">
           <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
             <AlertTriangle size={24} />
             <p className="font-bold text-sm">You need to set up your property first.</p>
           </div>
           <p className="text-slate-600 text-sm leading-relaxed">
             Before you can add rooms or room types, you must register your hotel, lodge, or guesthouse details.
           </p>
           <div className="flex justify-end gap-3 pt-2">
             <button
               onClick={() => setIsWarningOpen(false)}
               className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold text-sm transition-colors"
             >
               Cancel
             </button>
             <Link
               href="/dashboard/setup"
               className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold text-sm transition-colors"
             >
               Setup Property <ArrowRight size={16} />
             </Link>
           </div>
        </div>
      </Modal>
    </div>
  );
}

// --- Sub-Components ---

interface RoomsTableProps {
  rooms: Room[];
  onEdit: (room: Room) => void;
  onDelete: (id: string) => void;
}

function RoomsTable({ rooms, onEdit, onDelete }: RoomsTableProps) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'clean': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'dirty': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'occupied': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'maintenance': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {rooms.map((room) => (
        <div 
          key={room.id} 
          className="group bg-white rounded-2xl p-5 border border-slate-300 shadow-md flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-xl hover:border-slate-400"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-lg border border-slate-900">
                {room.room_number}
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${getStatusColor(room.status)}`}>
                {room.status}
              </span>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Room Type</p>
              <p className="font-bold text-slate-900 text-sm line-clamp-1">
                {room.room_types?.name || 'Unassigned'}
              </p>
            </div>

            {room.notes && (
              <div className="mt-4 pt-3 border-t border-slate-50">
                <p className="text-xs text-slate-500 line-clamp-2 italic">
                  "{room.notes}"
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
            <button 
              onClick={() => onEdit(room)} 
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Room"
            >
              <Edit size={16} />
            </button>
            <button 
              onClick={() => onDelete(room.id)} 
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Room"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      
      {rooms.length === 0 && (
        <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <LayoutGrid size={24} />
          </div>
          <p className="text-slate-900 font-bold">No rooms found</p>
          <p className="text-slate-500 text-sm mt-1">Add your first physical room to get started.</p>
        </div>
      )}
    </div>
  );
}

interface RoomFormProps {
  initialData: Room | null;
  roomTypes: RoomType[];
  onSuccess: () => void;
}

function RoomForm({ initialData, roomTypes, onSuccess }: RoomFormProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState({
    room_number: initialData?.room_number || '',
    room_type_id: initialData?.room_type_id || '',
    status: initialData?.status || 'clean',
    notes: initialData?.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get property ID (simplified for brevity, assume profile has it or user metadata)
    let propertyId = user.user_metadata?.property_id; 
    if (!propertyId) {
         const { data: profile } = await supabase.from('profiles').select('property_id').eq('id', user.id).single();
         propertyId = profile?.property_id;
    }

    if (!propertyId) {
        alert('No property selected');
        setLoading(false);
        return;
    }

    const payload = {
        ...formData,
        property_id: propertyId
    };

    let error;
    if (initialData) {
        const { error: e } = await supabase.from('rooms').update(payload).eq('id', initialData.id);
        error = e;
    } else {
        const { error: e } = await supabase.from('rooms').insert(payload);
        error = e;
    }

    if (error) {
        alert(error.message);
    } else {
        onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Room Number</label>
            <input 
                required
                type="text" 
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-900"
                placeholder="e.g. 101"
                value={formData.room_number}
                onChange={e => setFormData({...formData, room_number: e.target.value})}
            />
        </div>
        
        <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Room Type</label>
            <select 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-900 bg-white"
                value={formData.room_type_id}
                onChange={e => setFormData({...formData, room_type_id: e.target.value})}
            >
                <option value="">Select a type...</option>
                {roomTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Cap: {t.capacity})</option>
                ))}
            </select>
        </div>

        <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
            <select 
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-900 bg-white"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
            >
                <option value="clean">Clean</option>
                <option value="dirty">Dirty</option>
                <option value="maintenance">Maintenance</option>
                <option value="occupied">Occupied</option>
            </select>
        </div>

        <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 mt-4"
        >
            {loading ? 'Saving...' : 'Save Room'}
        </button>
    </form>
  );
}
