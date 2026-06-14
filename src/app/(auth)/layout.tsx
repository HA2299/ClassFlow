export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950/95 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_30%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-16">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
          <div className="mb-10 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-primary/80">
              ברוכים הבאים ל-ClassFlow
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              נהל את הכיתות שלך בקלות ובמהירות
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-300">
              מערכת נוחה למורים ומרכזי לימוד עם חוויית משתמש מודרנית.
            </p>
          </div>
          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
