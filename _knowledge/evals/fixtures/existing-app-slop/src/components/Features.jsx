const features = [
  { title: 'Fast', subtitle: 'Lightning-fast performance for your workflow.' },
  { title: 'Secure', subtitle: 'Enterprise-grade security you can trust.' },
  { title: 'Scalable', subtitle: 'Grows with your business needs.' },
];

export default function Features() {
  return (
    <section className="grid grid-cols-3 gap-6 p-12">
      {features.map((f) => (
        <div key={f.title} className="rounded-2xl border border-slate-200 p-6 text-center">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full bg-indigo-100" />
          <h3 className="font-semibold">{f.title}</h3>
          <p className="mt-2 text-sm text-slate-500">{f.subtitle}</p>
        </div>
      ))}
    </section>
  );
}
