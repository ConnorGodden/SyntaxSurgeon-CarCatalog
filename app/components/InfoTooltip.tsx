type InfoTooltipProps = {
  text: string;
  label?: string;
  className?: string;
  align?: "center" | "left" | "right";
};

export default function InfoTooltip({
  text,
  label = "More info",
  className = "",
  align = "center",
}: InfoTooltipProps) {
  const alignmentClass =
    align === "left"
      ? "left-0 translate-x-0"
      : align === "right"
        ? "right-0 left-auto translate-x-0"
        : "left-1/2 -translate-x-1/2";

  return (
    <span className={`group relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-600"
      >
        ?
      </button>
      <span
        className={`pointer-events-none absolute top-[calc(100%+0.5rem)] z-40 w-64 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium leading-relaxed text-zinc-700 opacity-0 shadow-lg transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 ${alignmentClass}`}
      >
        {text}
      </span>
    </span>
  );
}
