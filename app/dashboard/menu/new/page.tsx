'use client';

import MenuWizard from '../components/MenuWizard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewMenuItemPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/menu" 
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Item</h1>
          <p className="text-gray-500">Create a new dish or beverage for your menu.</p>
        </div>
      </div>

      <MenuWizard />
    </div>
  );
}
