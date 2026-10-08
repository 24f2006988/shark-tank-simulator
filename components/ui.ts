/** Shared class names so buttons and fields look and behave the same everywhere (44 px touch targets). */
export const btn = {
  primary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-300 px-5 py-2 font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300",
  secondary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-600 px-4 py-2 font-medium text-slate-100 transition hover:border-slate-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60",
  ghost:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium text-slate-300 underline-offset-4 transition hover:text-slate-100 hover:underline disabled:cursor-not-allowed disabled:opacity-60",
};

export const field =
  "w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-400 hover:border-slate-400 aria-[invalid=true]:border-rose-400";

export const card = "rounded-2xl border border-slate-800 bg-slate-900/70";
