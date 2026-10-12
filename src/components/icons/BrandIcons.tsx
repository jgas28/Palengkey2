/** Google's four-colour "G" (official brand colours), for "Continue with Google". */
export function GoogleGIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

/** Google Play's four-colour triangle. */
export function GooglePlayLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <path
        fill="#00D7FE"
        d="M48 59c-5 5-8 13-8 23v348c0 10 3 18 8 23l2 2 195-195v-5L50 57z"
      />
      <path
        fill="#FFCE00"
        d="m310 320-65-65v-5l65-65 2 1 77 44c22 12 22 33 0 45l-77 44z"
      />
      <path fill="#FF3A44" d="M312 319 245 252 48 453c7 8 19 8 33 1l231-135" />
      <path fill="#00F076" d="M312 185 81 54c-14-8-26-7-33 1l197 197z" />
    </svg>
  );
}

/** Apple logo (white on the black App Store badge). */
export function AppleLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 384 512"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

/** Official-style black store badge ("Download on the App Store" / "Get it on Google Play"). */
export function StoreBadge({
  store,
  comingSoon = true,
}: {
  store: "apple" | "google";
  comingSoon?: boolean;
}) {
  const apple = store === "apple";
  return (
    <span className="store-badge" aria-label={apple ? "App Store" : "Google Play"}>
      {apple ? <AppleLogo size={20} /> : <GooglePlayLogo size={20} />}
      <span>
        <small>
          {comingSoon ? "COMING SOON ON" : apple ? "Download on the" : "GET IT ON"}
        </small>
        <strong>{apple ? "App Store" : "Google Play"}</strong>
      </span>
    </span>
  );
}
