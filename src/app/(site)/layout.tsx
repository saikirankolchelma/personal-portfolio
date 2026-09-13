import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Assistant } from "@/components/chat/assistant";

/**
 * Chrome for the public site only.
 *
 * The dashboard and login sit outside this route group, so they never render
 * the public header, footer, or the visitor-facing assistant.
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-accent-fg"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <Assistant />
    </>
  );
}
