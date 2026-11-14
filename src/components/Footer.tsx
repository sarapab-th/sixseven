import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LogoLockup } from "./Logo";
import { site } from "~/config/site";

const SERVICE_LINKS = [
  { href: "/3d-printing", key: "printing3d" },
  { href: "/printing", key: "digitalPrinting" },
  { href: "/quote", key: "quote" },
] as const;

const COMPANY_LINKS = [
  { href: "/gallery", key: "gallery" },
  { href: "/faq", key: "faq" },
  { href: "/contact", key: "contact" },
] as const;

export function Footer() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const tc = useTranslations("contact");

  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t border-line bg-ink-2">
      <div className="brand-gradient absolute inset-x-0 top-0 h-px opacity-50" />

      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <LogoLockup className="w-52" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{t("tagline")}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <a href={site.contact.lineUrl} target="_blank" rel="noopener noreferrer" className="btn btn-line !px-4 !py-2 text-sm">
                LINE {site.contact.lineId}
              </a>
              <a href={`tel:${site.contact.phoneRaw}`} className="btn btn-ghost !px-4 !py-2 text-sm">
                {site.contact.phone}
              </a>
            </div>
          </div>

          <div>
            <h2 className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-muted-2">
              {t("services")}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {SERVICE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted transition-colors hover:text-cyan">
                    {tn(l.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-muted-2">
              {t("company")}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted transition-colors hover:text-cyan">
                    {tn(l.key)}
                  </Link>
                </li>
              ))}
            </ul>

            <address className="mt-6 not-italic text-sm leading-relaxed text-muted-2">
              {site.address.street}
              <br />
              {site.address.district}, {site.address.city} {site.address.postalCode}
              <br />
              <a href={`mailto:${site.contact.email}`} className="transition-colors hover:text-cyan">
                {site.contact.email}
              </a>
            </address>
          </div>
        </div>

        <div className="rule-fade my-10" />

        <div className="flex flex-col items-start justify-between gap-4 text-xs text-muted-2 sm:flex-row sm:items-center">
          <p>
            © {year} {site.legalName}. {t("rights")}
          </p>
          <p className="max-w-md sm:text-right">{t("builtWith")}</p>
        </div>

        <p className="sr-only">{tc("hours")}</p>
      </div>
    </footer>
  );
}
