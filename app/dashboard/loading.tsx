import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-zambia-green" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
