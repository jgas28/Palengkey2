import type { ReactNode } from "react";

export interface InfoSectionProps {
  title: string;
  children: ReactNode;
}

export default function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-soft">
      <h2 className="mb-2 font-display font-bold text-text">{title}</h2>
      <div className="text-sm leading-relaxed text-text-muted">{children}</div>
    </div>
  );
}
