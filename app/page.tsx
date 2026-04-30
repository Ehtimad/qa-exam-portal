import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">

      {/* ── Nav ── */}
      <nav className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          QA Exam Portal
        </div>
        <div className="flex items-center gap-3">
          <Link href="/verify"
            className="text-blue-200 hover:text-white text-sm transition-colors hidden sm:block">
            Sertifikat Yoxla
          </Link>
          <Link href="/auth/signin"
            className="bg-white/10 text-white border border-white/30 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
            Daxil ol
          </Link>
          <Link href="/auth/register"
            className="bg-white text-blue-900 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors">
            Qeydiyyat
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-4 pt-12 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
          QA / ISTQB Sertifikasiya İmtahanı
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
          Biliklərinizi sınaqdan<br/>keçirin
        </h1>
        <p className="text-blue-300 text-lg mb-10 max-w-xl mx-auto">
          QA mühəndisliyi üzrə peşəkar imtahan platforması. İmtahanı uğurla bitirənlər rəqəmsal sertifikat alır.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="/auth/register"
            className="bg-white text-blue-900 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-base">
            İndi qeydiyyat ol →
          </Link>
          <Link href="/auth/signin"
            className="bg-white/10 text-white border border-white/30 px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors text-base">
            Daxil ol
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
          {[
            { value: "100", label: "Sual" },
            { value: "70%", label: "Keçmə həddi" },
            { value: "PDF", label: "Sertifikat" },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-blue-300 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Certificate verify section ── */}
      <section className="bg-white/5 backdrop-blur border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-xl mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Sertifikat Yoxla</h2>
            <p className="text-blue-300 text-sm mb-6">
              Sertifikatın alt hissəsindəki ID-ni daxil edərək həqiqiliyini yoxlayın
            </p>

            <CertVerifyForm />
          </div>
        </div>
      </section>

    </main>
  );
}

// Client component inline — just a form that navigates
function CertVerifyForm() {
  return (
    <form action="/verify" method="get" className="flex gap-2">
      <input
        type="text"
        name="id"
        placeholder="Sertifikat ID-ni daxil edin..."
        className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
      />
      <button
        type="submit"
        className="bg-green-500 hover:bg-green-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
      >
        Yoxla
      </button>
    </form>
  );
}
