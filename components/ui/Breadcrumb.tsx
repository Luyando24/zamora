'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav className={`flex items-center text-sm text-slate-500 mb-4 ${className}`} aria-label="Breadcrumb">
      <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
        <Home size={14} />
        <span className="sr-only">Home</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight size={14} className="mx-2 text-slate-400" />
          {item.href ? (
            <Link 
              href={item.href} 
              className="hover:text-slate-900 transition-colors font-medium"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 font-bold truncate max-w-[200px] md:max-w-none">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
