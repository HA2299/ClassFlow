export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.3),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.28),_transparent_30%)]" />
      <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_30px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative flex flex-col justify-between bg-[linear-gradient(135deg,rgba(30,64,175,0.92),rgba(12,74,110,0.88),rgba(13,148,136,0.82))] p-8 sm:p-10 lg:p-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.3em] text-blue-100 backdrop-blur-md">
                CLASSFLOW
              </div>
              <div className="space-y-4">
                <h1 className="max-w-md text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  נהל את הכיתות שלך בצורה חכמה, נעימה ומקצועית
                </h1>
                <p className="max-w-lg text-sm leading-7 text-blue-50/80 sm:text-base">
                  מערכת לניהול למידה, משימות, תובנות AI ותקשורת עם תלמידים —
                  הכול במקום אחד, עם חוויית משתמש עדכנית ומודרנית.
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                { label: "כיתות", value: "24" },
                { label: "משימות", value: "140" },
                { label: "שיעור הגשה", value: "92%" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/15 bg-white/8 px-4 py-3 backdrop-blur-md"
                >
                  <div className="text-2xl font-bold text-white">{item.value}</div>
                  <div className="text-xs text-blue-100/80">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/55 p-6 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-md">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
