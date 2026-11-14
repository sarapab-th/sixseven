"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { clsx } from "@/lib/clsx";
import type { Locale } from "@/i18n/routing";

const NAV = [
  { href: "/3d-printing", key: "printing3d" },
  { href: "/printing", key: "digitalPrinting" },
  { href: "/gallery", key: "gallery" },
  { href: "/faq", key: "faq" },
  { href: "/contact", key: "contact" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer whenever we land on a new page
  useEffect(() => setOpen(false), [pathname]);

  // A drawer that scrolls the page behind it feels broken
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const other: Locale = locale === "th" ? "en" : "th";
  const switchLocale = () => router.replace(pathname, { locale: other });

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-cyan focus:px-4 focus:py-2 focus:font-semibold focus:text-ink"
      >
        {tc("skipToContent")}
      </a>

      <header
        className={clsx(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-line bg-ink/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="container-x flex h-[72px] items-center justify-between gap-4">
          <Link href="/" aria-label={t("home")} className="shrink-0">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  isActive(item.href) ? "text-paper" : "text-muted hover:text-paper",
                )}
              >
                {t(item.key)}
                {isActive(item.href) && (
                  <span className="brand-gradient absolute inset-x-3.5 -bottom-px h-px" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={switchLocale}
              aria-label={t("switchLanguageLabel")}
              className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold tracking-wide text-muted transition-colors hover:border-cyan/50 hover:text-paper"
            >
              {t("switchLanguage")}
            </button>

            <Link href="/quote" className="btn btn-primary hidden !px-4 !py-2 text-sm sm:inline-flex">
              {tc("instantQuote")}
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={t("menu")}
              className="grid h-10 w-10 place-items-center rounded-lg border border-line-strong text-paper lg:hidden"
            >
              <span className="relative block h-3.5 w-5">
                <span className={clsx("absolute left-0 h-0.5 w-5 bg-current transition-all duration-300", open ? "top-1.5 rotate-45" : "top-0")} />
                <span className={clsx("absolute left-0 top-1.5 h-0.5 w-5 bg-current transition-opacity duration-200", open && "opacity-0")} />
                <span className={clsx("absolute left-0 h-0.5 w-5 bg-current transition-all duration-300", open ? "top-1.5 -rotate-45" : "top-3")} />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        className={clsx(
          "fixed inset-0 z-40 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          className={clsx("absolute inset-0 bg-ink/90 backdrop-blur-xl transition-opacity duration-300", open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <nav
          className={clsx(
            "absolute inset-x-0 top-[72px] origin-top px-5 pb-8 transition-all duration-300",
            open ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
          )}
          aria-label="Mobile"
        >
          <div className="panel rounded-2xl p-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium transition-colors",
                  isActive(item.href) ? "bg-white/5 text-paper" : "text-muted hover:bg-white/5 hover:text-paper",
                )}
              >
                {t(item.key)}
                <span className="text-muted-2">→</span>
              </Link>
            ))}
            <Link href="/quote" className="btn btn-primary mt-2 w-full">
              {tc("instantQuote")}
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
