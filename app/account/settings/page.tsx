'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, User, Mail, Phone, Lock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import GuestBottomNav from '@/components/guest/GuestBottomNav';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/login?next=/account/settings');
        return;
      }
      setUser(user);
      setFormData({
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || ''
      });
      setLoading(false);
    };

    checkUser();
  }, [router, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone
      }
    });

    if (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } else {
      toast.success('Profile updated successfully');
      router.refresh();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-pink-400 flex items-center justify-center font-bold text-xl shadow-lg shadow-pink-600/20 text-white">Z</div>
            <span className="hidden md:block font-bold text-2xl tracking-tight uppercase text-slate-900">Zamora</span>
          </Link>
          <div className="flex items-center gap-4">
             <Link href="/account" className="text-sm font-bold text-slate-500 hover:text-slate-900">My Account</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-4 md:px-6 py-12">
        <div className="mb-8">
            <Link href="/account" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black text-slate-900">Account Settings</h1>
        </div>

        <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <User size={16} className="text-slate-400" /> First Name
                    </label>
                    <input 
                        type="text" 
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                        placeholder="Mulenga"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Last Name</label>
                    <input 
                        type="text" 
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                        placeholder="Banda"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Mail size={16} className="text-slate-400" /> Email Address
                </label>
                <input 
                    type="email" 
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                />
                <p className="text-xs text-slate-400">Email address cannot be changed.</p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Phone size={16} className="text-slate-400" /> Phone Number
                </label>
                <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                    placeholder="+260 97 1234567"
                />
            </div>

            <div className="pt-6 border-t border-slate-100">
                <button 
                    type="submit" 
                    disabled={saving}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <>Saving...</>
                    ) : (
                        <>
                            <Save size={18} /> Save Changes
                        </>
                    )}
                </button>
            </div>

        </form>

        <div className="mt-8 bg-white p-8 rounded-3xl border border-red-100 shadow-sm">
             <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
                 <Lock size={18} /> Danger Zone
             </h3>
             <p className="text-slate-500 text-sm mb-6">Once you delete your account, there is no going back. Please be certain.</p>
             <button className="px-6 py-3 border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors">
                 Delete Account
             </button>
        </div>
      </main>
      <GuestBottomNav />
    </div>
  );
}
