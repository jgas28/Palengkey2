import type { ReactNode } from "react";

/** The Figma design's own line icon set (design/figma-make/App.tsx), 24px grid, 1.8 stroke. */
export type IconName =
  | "arrow"
  | "bag"
  | "bell"
  | "cart"
  | "check"
  | "chevron"
  | "clock"
  | "fish"
  | "facebook"
  | "instagram"
  | "leaf"
  | "menu"
  | "message"
  | "minus"
  | "pin"
  | "plus"
  | "search"
  | "shield"
  | "sparkle"
  | "star"
  | "truck"
  | "x";

const iconPaths: Record<IconName, ReactNode> = {
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  bag: <path d="M6 8h12l-1 12H7L6 8Zm3 0a3 3 0 0 1 6 0" />,
  bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />,
  cart: (
    <path d="M3 4h2l2.2 10.5a2 2 0 0 0 2 1.5H18a2 2 0 0 0 2-1.6L21 8H7M10 21h.01M18 21h.01" />
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  fish: <path d="M16.7 8.2C13 5.5 8 6 4 10c4 4 9 4.5 12.7 1.8L21 15V5l-4.3 3.2ZM8 10h.01" />,
  facebook: <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v6h4v-6h3l1-4h-4V9c0-.7.3-1 1-1Z" />,
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  leaf: <path d="M20 4C11 4 5 8 5 15c0 2 1 4 3 5 1-6 5-9 9-11-4 3-6 6-7 11 7 0 10-7 10-16Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  message: <path d="M21 12a8 8 0 0 1-8 8H6l-4 2 1.5-4A9 9 0 1 1 21 12Z" />,
  minus: <path d="M5 12h14" />,
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  shield: <path d="M12 3 4 6v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-3Zm-3 9 2 2 4-5" />,
  sparkle: (
    <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3ZM5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16Z" />
  ),
  star: (
    <path d="m12 3 2.7 5.5 6 .9-4.4 4.2 1.1 6-5.4-2.8-5.4 2.8 1-6-4.3-4.2 6-.9L12 3Z" />
  ),
  truck: (
    <path d="M3 5h11v11H3V5Zm11 4h4l3 4v3h-7V9ZM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
  ),
  x: <path d="m6 6 12 12M18 6 6 18" />,
};

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export default function Icon({ name, size = 20, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}
