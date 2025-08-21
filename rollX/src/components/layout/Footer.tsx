import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-border/40">
      <div className="container mx-auto px-4 lg:p-8 flex flex-col items-center gap-6 md:flex-row md:justify-between">
        {/* Left Side: Logo + Tagline */}
        <div className="text-center md:text-left">
          <Link
            href="/"
            className="flex items-center justify-center md:justify-start space-x-2"
          >
            <span className="font-bold">takeiteasy</span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            A modern solution for seamless attendance tracking.
          </p>
        </div>

        {/* Right Side: Links */}
        <div className="flex flex-wrap justify-center gap-4 md:justify-end">
          <Link
            href="/terms"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/40 py-4">
        <div className="container mx-auto px-4 flex justify-center">
          <p className="text-center text-sm leading-loose text-muted-foreground">
            &copy; {currentYear} takeiteasy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
