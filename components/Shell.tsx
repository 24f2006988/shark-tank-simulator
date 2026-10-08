import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

export interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  crumbs: Crumb[];
  /** Left rail under the brand (the panel list). Hidden on narrow screens, where the stage shows the same sharks. */
  sidebar?: ReactNode;
  /** Small status text and buttons at the right of the top bar. */
  status?: ReactNode;
  actions?: ReactNode;
  /** A slim row of controls under the top bar, like a notebook's formatting toolbar. */
  toolbar?: ReactNode;
  /** Wider content column, used by the tank so the faces get the room. */
  wide?: boolean;
  children: ReactNode;
}

function BrandMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="size-7 shrink-0">
      <rect width="32" height="32" rx="7" fill="var(--color-accent)" />
      <path d="M8 24c3-1 5-4 6-10 1-3 3-5 6-6-1 4-1 8 4 16-4-2-7-2-10 0-2 0-4 1-6 0Z" fill="var(--color-slate-950)" />
    </svg>
  );
}

/** The app frame: a quiet sidebar, a breadcrumb bar and a content column, the same structure as the sumigaki notebook. */
export function Shell({ crumbs, sidebar, status, actions, toolbar, wide = false, children }: Props) {
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 md:flex">
        <Link href="/" className="flex items-center gap-2.5 px-4 pt-3.5 pb-3 font-semibold text-slate-100">
          <BrandMark />
          Shark Tank
        </Link>
        <div className="flex-1 overflow-y-auto px-2 pb-4">{sidebar}</div>
        <p className="border-t border-slate-800 px-4 py-3 text-xs leading-relaxed text-slate-400">
          Built with the Gemini API on Google Cloud Run. The sharks are AI characters; their offers are practice, not investment advice.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950">
          <div className="flex min-h-12 items-center gap-3 px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold md:hidden">
              <BrandMark />
              <span className="sr-only">Shark Tank Simulator home</span>
            </Link>
            <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
              <ol className="flex items-center gap-1.5 truncate text-sm text-slate-400">
                {crumbs.map((c, i) => {
                  const last = i === crumbs.length - 1;
                  return (
                    <li key={c.label} className="flex min-w-0 items-center gap-1.5">
                      {c.href && !last ? (
                        <Link href={c.href} className="hover:text-slate-100 hover:underline">
                          {c.label}
                        </Link>
                      ) : (
                        <span aria-current={last ? "page" : undefined} className={last ? "truncate font-semibold text-slate-100" : undefined}>
                          {c.label}
                        </span>
                      )}
                      {last ? null : <span aria-hidden="true">/</span>}
                    </li>
                  );
                })}
              </ol>
            </nav>
            <div className="flex items-center gap-1 text-sm text-slate-400">
              {status}
              {actions}
              <ThemeToggle />
            </div>
          </div>
          {toolbar ? <div className="flex min-h-10 items-center gap-1 overflow-x-auto border-t border-slate-800 px-3">{toolbar}</div> : null}
        </header>

        <main id="main" className={`mx-auto flex w-full flex-1 flex-col gap-8 px-4 py-8 sm:px-8 ${wide ? "max-w-6xl" : "max-w-4xl"}`}>
          {children}
        </main>

        <footer className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-400 md:hidden">
          Built with the Gemini API on Google Cloud Run. The sharks are AI characters; their offers are practice, not investment advice.
        </footer>
      </div>
    </div>
  );
}
