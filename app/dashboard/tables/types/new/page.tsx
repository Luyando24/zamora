'use client';

import TableTypeWizard from '../../components/TableTypeWizard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewTableTypePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/tables" 
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Table Type</h1>
          <p className="text-gray-500">Create a new category of tables (e.g. Indoor, Outdoor, VIP).</p>
        </div>
      </div>

      <TableTypeWizard />
    </div>
  );
}
