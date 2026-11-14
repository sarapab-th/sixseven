import Link from "next/link";

/** Shown for paths that never reach the locale segment. */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          background: "#050507",
          color: "#f2f2f5",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100dvh",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ fontSize: "3rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>404</p>
          <p style={{ color: "#9a9aa8", marginTop: "0.5rem" }}>
            This page does not exist. / ไม่พบหน้านี้
          </p>
          <Link
            href="/th"
            style={{
              display: "inline-block",
              marginTop: "1.5rem",
              padding: "0.7rem 1.4rem",
              borderRadius: "0.75rem",
              background: "linear-gradient(100deg,#00E5FF,#9B5CFF 55%,#FF2E88)",
              color: "#06060a",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            SixSeven →
          </Link>
        </div>
      </body>
    </html>
  );
}
