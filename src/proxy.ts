import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Next 16 calls this a proxy; it is the old middleware convention renamed.
 * next-intl uses it to pick a locale and rewrite "/" to "/th".
 */
export default createMiddleware(routing);

export const config = {
  // Everything except API routes, Next internals, and files with an extension
  matcher: ["/", "/(th|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
