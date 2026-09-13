import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { profile } from "@/content/profile";
import { footerNav } from "@/lib/site";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-bg-subtle">
      <div className="container-px py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <p className="text-base font-semibold">{profile.name}</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-fg-muted">
              {profile.tagline}
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm text-fg-subtle">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {profile.location}
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href={profile.links.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
              <a
                href={profile.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn profile"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
              >
                <LinkedinIcon className="h-4 w-4" />
              </a>
              <a
                href={profile.links.email}
                aria-label="Email"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {footerNav.map((group) => (
            <div key={group.heading}>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-fg-subtle">
                {group.heading}
              </p>
              <ul className="mt-4 space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-fg-muted transition-colors hover:text-fg"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {profile.name}. All rights reserved.
          </p>
          <p>Built with Next.js, TypeScript and Tailwind CSS.</p>
        </div>
      </div>
    </footer>
  );
}
