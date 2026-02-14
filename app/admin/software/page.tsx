'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Monitor, Download, Plus, Trash2, CheckCircle2, 
  AlertCircle, Loader2, UploadCloud, Globe, Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface Release {
  id: string;
  version: string;
  download_url: string;
  release_notes: string;
  platform: string;
  is_latest: boolean;
  created_at: string;
}

export default function SoftwareManagement() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [version, setVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState('windows');

  const supabase = useMemo(() => createClient(), []);

  const fetchReleases = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_releases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReleases(data || []);
    } catch (error: any) {
      console.error('Error fetching releases:', error);
      toast.error('Failed to load releases');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !version) {
      toast.error('Please provide a file and version number');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `zamora-pos-${version}-${Date.now()}.${fileExt}`;
      const filePath = `releases/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('software')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('software')
        .getPublicUrl(filePath);

      // 3. Create release record via API (to handle is_latest logic)
      const response = await fetch('/api/admin/software/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version,
          download_url: publicUrl,
          release_notes: releaseNotes,
          platform,
          is_latest: true
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create release record');
      }

      toast.success('Software uploaded and released successfully');
      setIsModalOpen(false);
      resetForm();
      fetchReleases();
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload software');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setVersion('');
    setReleaseNotes('');
    setFile(null);
    setPlatform('windows');
  };

  const deleteRelease = async (id: string, url: string) => {
    if (!confirm('Are you sure you want to delete this release? This will also remove the file from storage.')) return;

    try {
      // 1. Delete from DB
      const { error: dbError } = await supabase
        .from('app_releases')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // 2. Extract path from URL to delete from storage
      // Example URL: https://xyz.supabase.co/storage/v1/object/public/software/releases/filename.exe
      const urlParts = url.split('/software/');
      if (urlParts.length > 1) {
        const storagePath = urlParts[1];
        await supabase.storage.from('software').remove([storagePath]);
      }

      toast.success('Release deleted');
      fetchReleases();
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete release');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Software Management</h1>
          <p className="text-slate-500">Manage desktop application releases and updates</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all font-medium shadow-sm"
        >
          <Plus size={20} />
          New Release
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Monitor size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Latest Version</p>
              <p className="text-2xl font-bold text-slate-900">
                {releases.find(r => r.is_latest)?.version || 'None'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Last Release</p>
              <p className="text-2xl font-bold text-slate-900">
                {releases[0] ? format(new Date(releases[0].created_at), 'MMM d, yyyy') : 'Never'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Globe size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Releases</p>
              <p className="text-2xl font-bold text-slate-900">{releases.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Releases Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Release History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">Version</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Platform</th>
                <th className="px-6 py-3 font-semibold">Release Date</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" />
                    <p className="mt-2 text-slate-500">Loading releases...</p>
                  </td>
                </tr>
              ) : releases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No releases found. Click &quot;New Release&quot; to upload your first software version.
                  </td>
                </tr>
              ) : (
                releases.map((release) => (
                  <tr key={release.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                          <Monitor size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">v{release.version}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {release.is_latest ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                          <CheckCircle2 size={12} />
                          Latest
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                          Previous
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-slate-600 text-sm font-medium">{release.platform}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {format(new Date(release.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a 
                          href={release.download_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-primary transition-colors"
                          title="Download"
                        >
                          <Download size={18} />
                        </a>
                        <button 
                          onClick={() => deleteRelease(release.id, release.download_url)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete"
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

      {/* New Release Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Plus size={20} className="text-primary" />
                Upload New Release
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white transition-colors"
              >
                <Trash2 size={20} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Version Number</label>
                  <input 
                    type="text" 
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g. 2.4.0"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Platform</label>
                  <select 
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  >
                    <option value="windows">Windows</option>
                    <option value="macos">macOS</option>
                    <option value="linux">Linux</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Binary File (.exe, .msi, .zip)</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    file ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 hover:border-primary/50'
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
                  }}
                >
                  <input 
                    type="file" 
                    id="software-file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept=".exe,.msi,.zip,.dmg"
                  />
                  <label htmlFor="software-file" className="cursor-pointer">
                    {file ? (
                      <div className="space-y-2">
                        <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                        <p className="text-sm font-bold text-emerald-700">{file.name}</p>
                        <p className="text-xs text-emerald-600/70">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <UploadCloud size={32} className="mx-auto text-slate-300" />
                        <p className="text-sm text-slate-500">Click or drag file to upload</p>
                        <p className="text-xs text-slate-400">Supported: .exe, .msi, .zip, .dmg</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Release Notes (Optional)</label>
                <textarea 
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="Describe what's new in this version..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={uploading}
                  className="flex-[2] px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={20} />
                      Publish Release
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
