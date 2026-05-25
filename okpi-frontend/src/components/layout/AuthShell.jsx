import { Link } from "react-router-dom";
import { Target } from "lucide-react";

export default function AuthShell({ eyebrow, title, description, stats = [], children }) {
  return (
    <div className="min-h-screen bg-[#eef3fb] p-4 text-ink sm:p-6">
      <div className="grid min-h-[calc(100vh-2rem)] overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between bg-[linear-gradient(180deg,#1f2b45_0%,#223050_58%,#2c3958_100%)] px-6 py-6 text-white sm:px-8 lg:px-10 lg:py-10">
          <div className="space-y-10">
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-inner shadow-black/10">
                <Target className="h-6 w-6" />
              </span>
              <div className="leading-tight">
                <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/55">
                  OKPI
                </div>
                <div className="text-lg font-semibold text-white">Hub</div>
              </div>
            </Link>

            <div className="max-w-xl space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">
                {eyebrow}
              </p>
              <h1 className="whitespace-pre-line text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="max-w-xl text-lg leading-8 text-white/75">{description}</p>
            </div>
          </div>

          {stats.length ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-4 shadow-[0_8px_28px_rgba(15,23,42,0.14)] backdrop-blur-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                      {Icon ? <Icon className="h-5 w-5" /> : null}
                    </div>
                    <div className="mt-6 text-3xl font-black tracking-tight">{stat.value}</div>
                    <div className="mt-1 text-sm text-white/65">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>

        <section className="flex items-center justify-center bg-[#f4f7fb] px-5 py-8 sm:px-8">
          <div className="w-full max-w-[640px] rounded-[30px] border border-slate-200 bg-white p-8 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
