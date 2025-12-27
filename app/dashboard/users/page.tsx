'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Users, Plus, Search, Shield, MoreVertical, 
  Mail, Phone, Calendar, Loader2, CheckCircle2 
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';
import { useProperty } from '../context/PropertyContext';

export default function TeamPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { selectedPropertyId } = useProperty();
  
  // Invite Form
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'staff',
    password: ''
  });
  const [inviting, setInviting] = useState(false);

  const supabase = createClient();

  const fetchTeam = useCallback(async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    try {
      // Fetch all profiles for this property
      // Note: We are fetching profiles where property_id matches selectedPropertyId.
      // However, property_staff table is the source of truth for many-to-many.
      // But based on setup page, it seems we are still using profiles.property_id for now as primary.
      // Let's check if we should join property_staff.
      
      // Checking the existing code:
      // const { data: team } = await supabase.from('profiles').select('*').eq('property_id', profile.property_id)
      
      // So let's stick to that for now to avoid breaking changes, but ideally we should use property_staff.
      // Actually, let's try to support both if possible, or just stick to what works.
      // Given the previous code used profiles.property_id, let's use that.
      
      const { data: team } = await supabase
        .from('profiles')
        .select('*')
        .eq('property_id', selectedPropertyId)
        .order('created_at', { ascending: false });

      setUsers(team || []);
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId, supabase]);

  useEffect(() => {
    if (selectedPropertyId) {
        fetchTeam();
    }
  }, [selectedPropertyId, fetchTeam]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) return;
    
    setInviting(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          propertyId: selectedPropertyId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Member added successfully');
      setIsInviteOpen(false);
      setFormData({ email: '', firstName: '', lastName: '', role: 'staff', password: '' });
      fetchTeam(); // Refresh list
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setInviting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.first_name + ' ' + u.last_name).toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Members</h1>
          <p className="text-slate-500">Manage your property&apos;s staff and their access levels.</p>
        </div>
        <button 
          onClick={() => setIsInviteOpen(true)}
          className="px-4 py-2 bg-black text-white rounded-xl hover:bg-slate-800 font-bold shadow-lg shadow-slate-900/10 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={18} />
          Add Member
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-center">
        <Search className="text-slate-400" size={20} />
        <input 
          placeholder="Search by name or email..." 
          className="flex-1 bg-transparent outline-none text-slate-900 placeholder-slate-400"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin" />
            <p>Loading team members...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-900">No team members found</h3>
            <p>Invite your first team member to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{user.first_name} {user.last_name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Mail size={12} /> {user.email}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold capitalize
                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                      user.role === 'manager' ? 'bg-blue-100 text-blue-700' : 
                      'bg-slate-100 text-slate-700'}`}
                  >
                    {user.role}
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Add Team Member"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-black/5 outline-none text-slate-900"
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-black/5 outline-none text-slate-900"
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
          </div>
          
          <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-black/5 outline-none text-slate-900"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-black/5 outline-none text-slate-900"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <div className="grid grid-cols-3 gap-3">
              {['admin', 'manager', 'staff'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormData({...formData, role})}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all capitalize
                    ${formData.role === role 
                      ? 'bg-black text-white border-black' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  {role}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {formData.role === 'admin' && 'Full access to all settings and financial data.'}
              {formData.role === 'manager' && 'Can manage operations, inventory, and staff.'}
              {formData.role === 'staff' && 'Limited access to assigned tasks and orders.'}
            </p>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsInviteOpen(false)}
              className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviting}
              className="flex-1 px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {inviting ? <Loader2 className="animate-spin" /> : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
