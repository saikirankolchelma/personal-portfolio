import { profile } from "@/content/profile";

/**
 * Set NEXT_PUBLIC_SITE_URL in the deployment environment. Falls back to the
 * Vercel-provided URL, then to localhost for development.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

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
