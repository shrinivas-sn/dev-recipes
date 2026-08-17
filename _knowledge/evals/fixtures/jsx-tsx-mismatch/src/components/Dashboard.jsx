export default function Dashboard() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 p-6">Revenue</div>
        <div className="rounded-2xl border border-slate-200 p-6">Active users</div>
        <div className="rounded-2xl border border-slate-200 p-6">Churn</div>
      </div>
    </main>
  );
}
