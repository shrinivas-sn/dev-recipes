export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center text-center px-6">
      <div>
        <p className="text-sm uppercase tracking-widest text-slate-500">Now in beta</p>
        <h1 className="text-5xl font-bold mt-4">Ship products people actually use</h1>
        <p className="text-slate-400 mt-4 max-w-xl mx-auto">
          The platform for teams who want to move fast without breaking things.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button className="rounded-2xl bg-slate-900 text-white px-6 py-3">Get started</button>
          <button className="rounded-2xl border border-slate-300 px-6 py-3">Learn more</button>
        </div>
      </div>
    </section>
  );
}
