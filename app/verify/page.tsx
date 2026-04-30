import { redirect } from "next/navigation";
import Link from "next/link";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  // If id came as query param (from home page form), redirect to pretty URL
  if (id?.trim()) {
    redirect(`/verify/${id.trim()}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Sertifikat Yoxlama</h1>
          <p className="text-blue-300 text-sm mt-2">Sertifikatın həqiqiliyini yoxlayın</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <form action="/verify" method="get" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sertifikat ID</label>
              <input
                type="text"
                name="id"
                placeholder="Sertifikat üzərindəki ID-ni daxil edin"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                ID sertifikatın alt hissəsindəki "Sertifikat ID:" xəttindən götürülür
              </p>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Yoxla
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-blue-300 hover:text-white text-sm transition-colors">
            ← Ana səhifəyə qayıt
          </Link>
        </div>
      </div>
    </div>
  );
}
