import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <h2 className="text-4xl font-bold mb-4">Page Not Found</h2>
      <p className="text-slate-400 mb-8">Could not find requested resource</p>
      <Link 
        href="/"
        className="px-6 py-3 bg-zambia-green text-white rounded-xl hover:bg-green-600 transition-colors font-bold"
      >
        Return Home
      </Link>
    </div>
  )
}
