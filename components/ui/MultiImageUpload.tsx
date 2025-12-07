'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export interface MultiImageUploadProps {
  values?: string[];
  onChange: (urls: string[]) => void;
  bucket?: string;
}

export default function MultiImageUpload({ values = [], onChange, bucket = 'menu-images' }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const newUrls: string[] = [];
      const files = Array.from(event.target.files);

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue; 
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
      }

      onChange([...values, ...newUrls]);
    } catch (error: any) {
      alert('Error uploading images: ' + error.message);
    } finally {
      setUploading(false);
      // Reset input so same files can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newValues = values.filter((_, index) => index !== indexToRemove);
    onChange(newValues);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Gallery Images</label>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {values.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-gray-200 group">
            <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="bg-white p-1.5 rounded-full text-red-600 hover:bg-red-50"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-zambia-green hover:bg-green-50 transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          ) : (
            <ImagePlus className="h-8 w-8 text-gray-400" />
          )}
          <span className="text-xs text-gray-500 mt-2">Add Photos</span>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleUpload}
        disabled={uploading}
      />
    </div>
  );
}
