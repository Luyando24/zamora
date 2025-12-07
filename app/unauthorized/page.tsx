import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <ShieldAlert className="h-24 w-24 text-red-500" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Access Denied
        </h1>
        <p className="text-lg text-gray-500">
          You do not have the necessary permissions to view this page.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="text-base font-medium text-zambia-green hover:text-green-700"
          >
            Go to Dashboard
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/login"
            className="text-base font-medium text-gray-600 hover:text-gray-900"
          >
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
}
