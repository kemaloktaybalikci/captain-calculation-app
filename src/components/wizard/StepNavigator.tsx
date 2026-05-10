"use client";

const STEPS = ["Kadro", "Ayarlar", "Hesapla"];

export function StepNavigator({
  current,
  onChange,
  canGoTo,
}: {
  current: number;
  onChange: (step: number) => void;
  canGoTo?: (step: number) => boolean;
}) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-1">
      {STEPS.map((label, i) => {
        const active = i === current;
        const done = i < current;
        const disabled = canGoTo ? !canGoTo(i) : false;
        return (
          <div key={i} className="flex items-center">
            <button
              onClick={() => !disabled && onChange(i)}
              disabled={disabled}
              className={`group inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md whitespace-nowrap transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                active
                  ? "bg-zinc-900 text-white"
                  : done
                    ? "text-zinc-700 hover:bg-zinc-50 disabled:hover:bg-transparent"
                    : "text-zinc-500 hover:bg-zinc-50 disabled:hover:bg-transparent"
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
