import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-2xl mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">QA Online Exam Portal</h1>
          <p className="text-blue-300 text-sm">7 Mühazirə • 100 Sual • 500 Bal</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10 text-white">
          {[
            { label: "Mühazirə", value: "7" },
            { label: "Sual", value: "100" },
            { label: "Maksimum Bal", value: "500" },
          ].map((item) => (
            <div key={item.label} className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl font-bold">{item.value}</div>
              <div className="text-blue-200 text-sm mt-1">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className="bg-white text-blue-900 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-lg"
          >
            Qeydiyyat
          </Link>
          <Link
            href="/auth/signin"
            className="bg-white/10 text-white border border-white/30 px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors text-lg"
          >
            Daxil ol
          </Link>
        </div>
      </div>
    </main>
  );
}
