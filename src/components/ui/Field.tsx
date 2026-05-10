"use client";
import { useEffect, useState, type ReactNode } from "react";

export function Field({
  label,
  hint,
  tooltip,
  children,
  required,
}: {
  label: string;
  hint?: string;
  tooltip?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-zinc-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {tooltip && (
          <span
            tabIndex={0}
            aria-label={tooltip}
            className="tooltip-anchor relative ml-1 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-200 text-zinc-600 text-[10px] font-medium cursor-help align-middle hover:bg-zinc-300 focus-visible:bg-zinc-300 focus:outline-none transition-colors"
          >
            ?
            <span className="tooltip-bubble pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 px-2 py-1 text-xs font-normal bg-zinc-900 text-white rounded shadow-lg w-max max-w-xs whitespace-normal text-left normal-case tracking-normal">
              {tooltip}
            </span>
          </span>
        )}
      </span>
      {children}
      {hint && (
        <span className="block text-xs text-zinc-500 mt-1">
          {hint}
        </span>
      )}
    </label>
  );
}

const inputBase =
  "w-full rounded-md border px-3 py-2 text-sm bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:border-zinc-500";

export function NumberInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  placeholder?: string;
  className?: string;
}) {
  const [text, setText] = useState<string>(() =>
    value === 0 ? "" : String(value),
  );

  useEffect(() => {
    const parsed = parseFloat(text.replace(",", "."));
    const current = Number.isFinite(parsed) ? parsed : 0;
    if (current !== value) {
      setText(value === 0 ? "" : String(value));
    }
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        if (!/^[0-9.,]*$/.test(raw)) return;
        setText(raw);
        if (raw === "") {
          onChange(0);
          return;
        }
        const v = parseFloat(raw.replace(",", "."));
        onChange(Number.isFinite(v) ? v : 0);
      }}
      onFocus={(e) => e.currentTarget.select()}
      placeholder={placeholder ?? "0"}
      className={`${inputBase} tabular-nums ${className ?? ""}`}
    />
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  className,
  onKeyDown,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      className={`${inputBase} ${className ?? ""}`}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={`${inputBase} appearance-none ${className ?? ""}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none text-zinc-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-zinc-300"
      />
      <span>{label}</span>
    </label>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  className,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium px-3 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles: Record<string, string> = {
    primary:
      "bg-zinc-900 text-white hover:bg-zinc-700",
    secondary:
      "bg-white border border-zinc-300 text-zinc-900 hover:bg-zinc-50",
    danger:
      "bg-red-600 text-white hover:bg-red-500",
    ghost:
      "text-zinc-700 hover:bg-zinc-100",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${styles[variant]} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Card({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-white border border-zinc-200/80 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className ?? ""}`}
    >
      {title && (
        <h3 className="text-base font-semibold text-zinc-900 mb-4 tracking-tight">
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

export function IconButton({
  children,
  onClick,
  title,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
