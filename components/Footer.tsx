import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative border-t border-border-dark bg-background text-foreground pt-20 pb-12 overflow-hidden">
      {/* Background Radial Glow Effect */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-primary/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="mx-auto container sm:px-10 px-5 relative z-10">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-16 border-b border-border-dark/80">
          {/* Brand & Contact Card - Spans 5 cols */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-8 bg-dark-100/50 border border-dark-200 p-8 rounded-2xl backdrop-blur-md">
            <div className="space-y-4">
              <Link href="/" className="inline-flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <span className="text-2xl font-bold  tracking-tight text-gradient">
                  DevEvents
                </span>
              </Link>
              <p className="text-light-200 text-sm leading-relaxed max-w-xs font-light">
                20619 Torrence Chapel Rd, Suite 116
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border-dark">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-light-200/60 block mb-1">
                  Phone
                </span>
                <a
                  href="tel:1-800-201-1019"
                  className="text-sm font-medium text-light-100 hover:text-primary transition-colors font-schibsted-grotesk"
                >
                  1-800-201-1019
                </a>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-light-200/60 block mb-1">
                  Email
                </span>
                <a
                  href="mailto:support@skipmatrix.com"
                  className="text-sm font-medium text-light-100 hover:text-primary transition-colors font-schibsted-grotesk"
                >
                  support@skipmatrix.com
                </a>
              </div>
            </div>
          </div>

          {/* Links Section - Spans 7 cols */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 pt-2">
            {/* Column 1: Quick Links */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-blue font-semibold">
                Quick Links
              </h3>
              <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                {["Pricing", "Resources", "About us", "FAQ", "Contact us"].map(
                  (item) => (
                    <li key={item}>
                      <Link
                        href={`/${item.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-light-200 hover:text-foreground text-sm font-light transition-all hover:translate-x-1 inline-block"
                      >
                        {item}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>

            {/* Column 2: Social */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-blue font-semibold">
                Social
              </h3>
              <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                {[
                  "Facebook",
                  "Instagram",
                  "LinkedIn",
                  "Twitter",
                  "YouTube",
                ].map((platform) => (
                  <li key={platform}>
                    <a
                      href={`https://${platform.toLowerCase()}.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-light-200 hover:text-foreground text-sm font-light transition-all hover:translate-x-1 inline-block"
                    >
                      {platform}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Legal */}
            <div className="flex flex-col gap-4 col-span-2 sm:col-span-1">
              <h3 className="text-xs font-mono uppercase tracking-widest text-blue font-semibold">
                Legal
              </h3>
              <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                {[
                  { name: "Terms of service", path: "/terms" },
                  { name: "Privacy policy", path: "/privacy" },
                  { name: "Cookie policy", path: "/cookies" },
                ].map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.path}
                      className="text-light-200 hover:text-foreground text-sm font-light transition-all hover:translate-x-1 inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-light-200/60 font-light">
          {/* <p>
            © {new Date().getFullYear()} Skipmatrix Inc. All rights reserved.
          </p> */}
          <p>© 2026 Skipmatrix Inc. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Systems Normal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
