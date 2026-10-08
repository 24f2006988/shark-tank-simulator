const sharks = [
  { name: "Vikram", focus: "The Numbers" },
  { name: "Meera", focus: "The Customer" },
  { name: "Arjun", focus: "The Skeptic" },
  { name: "Zara", focus: "The Visionary" },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Shark Tank Simulator</h1>
      <p className="max-w-xl text-lg opacity-80">
        Pitch your idea to an AI investor panel that will not go easy on you.
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {sharks.map((s) => (
          <li key={s.name} className="rounded-xl border border-current/20 px-4 py-3">
            <div className="font-semibold">{s.name}</div>
            <div className="text-sm opacity-70">{s.focus}</div>
          </li>
        ))}
      </ul>
      <p className="text-sm opacity-60">The tank opens soon.</p>
    </main>
  );
}
