import type { ReactNode } from "react";

export interface InfoPageHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
}

export default function InfoPageHeader({
  icon,
  title,
  description,
}: InfoPageHeaderProps) {
  return (
    <div className="relative -mx-4 -mt-4 flex flex-col items-center gap-3 overflow-hidden bg-primary-500 px-4 py-12 text-center text-white md:-mx-6 md:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-accent/25 blur-3xl"
      />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-soft backdrop-blur-sm">
        {icon}
      </div>
      <h1 className="relative text-2xl font-extrabold">{title}</h1>
      {description && (
        <p className="relative max-w-sm text-sm text-white/85">{description}</p>
      )}
    </div>
  );
}
