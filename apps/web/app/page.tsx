import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';

export default function HomePage(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-50 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-emerald-600/20 blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-4xl pt-8 pb-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-extrabold tracking-tight md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">
            Welcome to Univisionz
          </h1>
          <p className="mx-auto max-w-xl text-lg text-zinc-400">
            Access your HRMS portal below. Your workspace awaits.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-1 lg:gap-8">
          {/* HRMS Portal Card */}
          <Link href="/dashboard" className="group relative rounded-2xl p-[1px] bg-gradient-to-b from-zinc-800 to-zinc-900 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-900/20 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-950">
            <div className="flex h-full flex-col justify-between rounded-2xl bg-zinc-950/80 p-8 backdrop-blur-xl transition-colors duration-300 group-hover:bg-zinc-900/80">
              <div>
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 shadow-inner ring-1 ring-violet-500/20 transition-transform duration-300 group-hover:-translate-y-1">
                  <Building2 size={28} />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-zinc-100">HRMS Portal</h2>
                <p className="text-zinc-400 leading-relaxed">
                  Manage your employees, attendance, leaves, payroll, and recruitment in one unified human resources system.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-violet-400 opacity-80 transition-opacity duration-300 group-hover:opacity-100">
                <span>Enter HRMS</span>
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
