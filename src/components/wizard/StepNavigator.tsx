"use client";

const STEPS = ["Kadro", "Genel Ayarlar", "Hesapla"];

export function StepNavigator({
  current,
  onChange,
}: {
  current: number;
  onChange: (step: number) => void;
}) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-1">
      {STEPS.map((label, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <div key={i} className="flex items-center">
            <button
              onClick={() => onChange(i)}
              className={`group inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md whitespace-nowrap transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                active
                  ? "bg-zinc-900 text-white"
                  : done
                    ? "text-zinc-700 hover:bg-zinc-50"
                    : "text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-medium transition ${
                  active
                    ? "bg-black/15 text-current"
                    : done
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={active ? "font-medium" : ""}>{label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className="w-6 h-px bg-zinc-200 mx-1" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
