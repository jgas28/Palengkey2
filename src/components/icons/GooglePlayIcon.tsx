export default function GooglePlayIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-12.61-2.87-2.87L3.18 23.76zm16.35-11.49-3.03-3.03 3.09-3.08c.38.55.61 1.22.61 1.95 0 1.5-.7 2.83-1.67 4.16zM2.14.37C1.8.6 1.56 1 1.56 1.51v20.98c0 .51.24.9.58 1.13l.1.07L13.73 12 2.24.3l-.1.07zm11.3 11.52L2.72.28l12.58 7.1-3.86 3.87z" />
    </svg>
  );
}
