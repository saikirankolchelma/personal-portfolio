"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { navItems } from "@/lib/site";
import { profile } from "@/content/profile";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { buttonClass } from "@/components/ui/primitives";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    // Sync once on mount for reloads that land mid-page. Deferred to a frame
    // so it runs as a callback rather than synchronously in the effect body.
    const frame = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled
          ? "border-border bg-bg/80 backdrop-blur-xl"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="container-px flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-sm font-semibold tracking-tight"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface font-mono text-[0.7rem] text-accent transition-colors group-hover:border-accent/40">
            SK
          </span>
          <span className="hidden sm:inline">{profile.shortName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm transition-colors",
                isActive(item.href)
                  ? "bg-surface-2 text-fg"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={profile.links.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile"
            className="hidden h-9 w-9 place-items-center rounded-full border border-border text-fg-muted transition-colors hover:border-border-strong hover:text-fg sm:grid"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
          <a
            href={profile.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn profile"
            className="hidden h-9 w-9 place-items-center rounded-full border border-border text-fg-muted transition-colors hover:border-border-strong hover:text-fg sm:grid"
          >
            <LinkedinIcon className="h-4 w-4" />
          </a>
          <ThemeToggle />
          <Link href="/contact" className={buttonClass({ size: "sm", className: "hidden md:inline-flex" })}>
            Get in touch
          </Link>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-fg-muted md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-bg md:hidden">
          <nav className="container-px flex flex-col py-4" aria-label="Mobile">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-3 text-base transition-colors",
                  isActive(item.href) ? "bg-surface-2 text-fg" : "text-fg-muted",
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex items-center gap-3 border-t border-border pt-4">
              <a
                href={profile.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-fg-muted"
              >
                <GithubIcon className="h-4 w-4" /> GitHub
              </a>
              <a
                href={profile.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-fg-muted"
              >
                <LinkedinIcon className="h-4 w-4" /> LinkedIn
              </a>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
