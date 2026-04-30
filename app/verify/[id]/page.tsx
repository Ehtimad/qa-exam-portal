import Link from "next/link";

interface VerifyResult {
  valid: boolean;
  error?: string;
  id?: string;
  studentName?: string;
  groupName?: string | null;
  score?: number;
  maxScore?: number;
  pct?: number;
  completedAt?: string;
}

async function verifyCertificate(id: string): Promise<VerifyResult> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/verify/${id}`, { cache: "no-store" });
    return res.json();
  } catch {
    return { valid: false, error: "Sorğu zamanı xəta baş verdi" };
  }
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await verifyCertificate(id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">

        {/* Result card */}
        {result.valid ? (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Green header */}
            <div className="bg-green-500 px-6 py-5 text-white text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold">Sertifikat Doğrudur</h1>
              <p className="text-green-100 text-sm mt-1">Bu sertifikat həqiqidir və sistemdə qeydiyyatdadır</p>
            </div>

            {/* Details */}
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500 font-medium">Tələbə</span>
                <span className="text-sm font-semibold text-gray-900">{result.studentName}</span>
              </div>
              {result.groupName && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500 font-medium">Qrup</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {result.groupName}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500 font-medium">İmtahan</span>
                <span className="text-sm font-semibold text-gray-900">QA / ISTQB Əsasları</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500 font-medium">Nəticə</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {result.score} / {result.maxScore}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    {result.pct}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500 font-medium">Tarix</span>
                <span className="text-sm font-semibold text-gray-900">
                  {result.completedAt
                    ? new Date(result.completedAt).toLocaleDateString("az-AZ", {
                        year: "numeric", month: "long", day: "numeric",
                      })
                    : "–"}
                </span>
              </div>
              <div className="flex items-start justify-between py-3">
                <span className="text-sm text-gray-500 font-medium">Sertifikat ID</span>
                <span className="text-xs font-mono text-gray-400 break-all text-right max-w-xs">
                  {result.id}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-green-50 px-6 py-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-green-700">Bu sertifikat QA İmtahan Portalı tərəfindən rəqəmsal olaraq təsdiqlənmişdir</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Red header */}
            <div className="bg-red-500 px-6 py-5 text-white text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-bold">Sertifikat Tapılmadı</h1>
              <p className="text-red-100 text-sm mt-1">
                {result.error ?? "Bu ID ilə sertifikat mövcud deyil"}
              </p>
            </div>

            <div className="px-6 py-5">
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                <p className="text-sm text-amber-800 font-medium">Yoxlanan ID:</p>
                <p className="text-xs font-mono text-amber-700 mt-0.5 break-all">{id}</p>
              </div>
              <p className="text-sm text-gray-500 text-center">
                ID-ni sertifikatdan düzgün kopyaladığınızdan əmin olun
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Link href="/verify"
            className="text-white/80 hover:text-white text-sm transition-colors">
            Yenidən yoxla
          </Link>
          <span className="text-white/30">•</span>
          <Link href="/"
            className="text-white/80 hover:text-white text-sm transition-colors">
            Ana səhifə
          </Link>
        </div>
      </div>
    </div>
  );
}
