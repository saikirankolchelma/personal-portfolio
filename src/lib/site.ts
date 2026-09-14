import { profile } from "@/content/profile";

const LOCAL_URL = "http://localhost:3000";

/**
 * Resolves the public base URL.
 *
 * This runs at module scope and feeds `metadataBase`, so anything it returns
 * must parse as a URL — a bad value fails the whole build rather than
 * degrading. It therefore normalises rather than trusting the environment:
 *
 *  - Empty and whitespace-only values count as absent. `??` does not catch
 *    those, and an env var set to "" in a dashboard is easy to do by accident.
 *  - A bare host ("my-app.vercel.app") gets https:// prepended, since pasting
 *    the domain without a scheme is the obvious mistake.
 *  - Trailing slashes are stripped, so canonical links never double up.
 *  - Anything still unparseable falls back to localhost with a warning,
 *    because a wrong canonical URL is a smaller problem than no deploy.
 */
function resolveSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    // Set automatically on Vercel, without a protocol.
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ];

  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;

    const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;

    try {
      const url = new URL(withScheme);
      return url.origin;
    } catch {
      console.warn(
        `[site] Ignoring unparseable site URL: ${JSON.stringify(value)}`,
      );
    }
  }

  return LOCAL_URL;
}

export const siteUrl = resolveSiteUrl();

export const site = {
  name: profile.name,
  shortName: profile.shortName,
  title: `${profile.name} — ${profile.title}`,
  description: profile.summary,
  url: siteUrl,
  locale: "en_IN",
} as const;

export type NavItem = { href: string; label: string };

export const navItems: NavItem[] = [
  { href: "/about", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/projects", label: "Projects" },
  { href: "/ai-lab", label: "AI Lab" },
  { href: "/freelance", label: "Freelance" },
  { href: "/play", label: "Play" },
  { href: "/contact", label: "Contact" },
];

export const footerNav: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Portfolio",
    items: [
      { href: "/about", label: "About" },
      { href: "/experience", label: "Experience" },
      { href: "/projects", label: "Projects" },
      { href: "/ai-lab", label: "AI Lab" },
    ],
  },
  {
    heading: "Work with me",
    items: [
      { href: "/freelance", label: "Freelance services" },
      { href: "/freelance#inquiry", label: "Project inquiry" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "More",
    items: [
      { href: "/play", label: "Games & tools" },
      { href: "/play/tic-tac-toe", label: "Tic-Tac-Toe" },
      { href: "/play/snake", label: "Snake" },
      { href: "/play/pomodoro", label: "Pomodoro timer" },
    ],
  },
];
