import type { ReactNode, ElementType, ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Section — consistent vertical rhythm for every page block.
 * ------------------------------------------------------------------ */
export function Section({
  children,
  className,
  id,
  bleed = false,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Skip the container so the child can run full-bleed. */
  bleed?: boolean;
}) {
  return (
    <section id={id} className={cn("py-16 sm:py-24", className)}>
      {bleed ? children : <div className="container-px">{children}</div>}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Eyebrow / SectionHeading
 * ------------------------------------------------------------------ */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-accent",
        className,
      )}
    >
      <span aria-hidden className="inline-block h-px w-6 bg-accent/60" />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-10 sm:mb-14",
        align === "center" && "text-center",
        action && "sm:flex sm:items-end sm:justify-between sm:gap-8",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <Eyebrow className={align === "center" ? "justify-center" : undefined}>{eyebrow}</Eyebrow>
        ) : null}
        <h2 className="text-3xl font-semibold sm:text-4xl">{title}</h2>
        {description ? (
          <p className="mt-4 text-base leading-relaxed text-fg-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-6 shrink-0 sm:mt-0">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Card
 * ------------------------------------------------------------------ */
export function Card<T extends ElementType = "div">({
  as,
  className,
  interactive = false,
  children,
  ...rest
}: { as?: T; className?: string; interactive?: boolean; children?: ReactNode } & Omit<
  ComponentPropsWithoutRef<T>,
  "as" | "className" | "children"
>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={cn(
        "rounded-[var(--radius-card)] border border-border bg-surface",
        interactive &&
          "transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_8px_40px_-12px_var(--glow)]",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ *
 * Badge
 * ------------------------------------------------------------------ */
const badgeTones = {
  default: "border-border bg-surface-2 text-fg-muted",
  accent: "border-accent/30 bg-accent-soft text-accent",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  outline: "border-border-strong bg-transparent text-fg-subtle",
} as const;

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof badgeTones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Button / ButtonLink — one visual definition, two element types.
 * ------------------------------------------------------------------ */
const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50";

const buttonVariants = {
  primary:
    "bg-accent text-accent-fg hover:brightness-110 shadow-[0_4px_24px_-6px_var(--glow)] hover:shadow-[0_6px_32px_-6px_var(--glow)]",
  secondary: "border border-border-strong bg-surface text-fg hover:bg-surface-2",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
} as const;

const buttonSizes = {
  sm: "h-9 px-4",
  md: "h-11 px-6",
  lg: "h-12 px-7 text-[0.95rem]",
} as const;

type ButtonStyleProps = {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  className?: string;
};

export function buttonClass({ variant = "primary", size = "md", className }: ButtonStyleProps = {}) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

export function Button({
  variant,
  size,
  className,
  ...rest
}: ButtonStyleProps & ComponentPropsWithoutRef<"button">) {
  return <button className={buttonClass({ variant, size, className })} {...rest} />;
}

export function ButtonLink({
  href,
  variant,
  size,
  className,
  external,
  children,
  ...rest
}: ButtonStyleProps & {
  href: string;
  external?: boolean;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"a">, "href" | "className">) {
  const classes = buttonClass({ variant, size, className });
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ *
 * Prose — shared typography for long-form blocks.
 * ------------------------------------------------------------------ */
export function BulletList({ items, className }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-relaxed text-fg-muted">
          <span
            aria-hidden
            className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-accent"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
