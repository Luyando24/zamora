export default function MenuIndexPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full space-y-6">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Menu Not Found</h1>
          <p className="text-slate-500">
            It looks like you&apos;ve accessed the menu page directly. Please scan a specific property&apos;s QR code or use the link provided by the establishment.
          </p>
        </div>
        <a 
          href="/"
          className="block w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
        >
          Go to Home
        </a>
      </div>
    </div>
  );
}