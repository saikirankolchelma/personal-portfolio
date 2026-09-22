import { Quote } from "lucide-react";

import { Card, Section, SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import { story } from "@/content/about";

/**
 * The only section on the site written in first person. Everything else says
 * what was built; this says why it was worth building.
 */
export function Story() {
  return (
    <Section id="why" className="border-t border-border">
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="The short version"
            title={story.heading}
            className="mb-6"
          />
          <p className="text-lg font-medium leading-relaxed text-fg sm:text-xl">
            {story.lead}
          </p>
        </div>

        <div className="space-y-5">
          {story.body.map((paragraph) => (
            <p key={paragraph} className="text-base leading-relaxed text-fg-muted">
              {paragraph}
            </p>
          ))}

          <Reveal>
            <Card className="mt-8 p-6 sm:p-7">
              <p className="mb-3 flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-accent">
                <Quote className="h-3.5 w-3.5" aria-hidden />
                {story.pullQuote.label}
              </p>
              <p className="text-sm leading-relaxed text-fg-muted">
                {story.pullQuote.text}
              </p>
            </Card>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
