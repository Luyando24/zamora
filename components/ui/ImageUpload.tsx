'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

export interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  className?: string;
  showLabel?: boolean;
}

export default function ImageUpload({ value, onChange, bucket = 'menu-images', className, showLabel = true }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Use our API route to upload (bypasses RLS issues)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('path', filePath);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      
      onChange(data.publicUrl);
    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {showLabel && <label className="block text-sm font-medium text-gray-700">Item Image</label>}
      
      {!value ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors group w-full h-full min-h-[12rem]"
        >
          <div className="space-y-1 text-center self-center">
            {uploading ? (
              <Loader2 className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
            ) : (
              <Upload className="mx-auto h-12 w-12 text-gray-400 group-hover:text-primary" />
            )}
            <div className="flex text-sm text-gray-600 justify-center">
              <span className="relative font-medium text-primary rounded-md focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                Upload a file
              </span>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
          </div>
        </div>
      ) : (
        <div className="relative mt-1 w-full h-full min-h-[12rem] rounded-md overflow-hidden border border-gray-200 group">
           <Image src={value} alt="Uploaded" fill className="object-cover" unoptimized />
           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
             <button
               type="button"
               onClick={() => onChange('')}
               className="bg-white p-2 rounded-full text-red-600 hover:bg-red-50"
             >
               <X size={20} />
             </button>
           </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
    </div>
  );
}
