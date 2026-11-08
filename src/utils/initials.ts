/** "Juan Dela Cruz" -> "JD"; "P" (for Palengkey) when there's no name. */
export function userInitials(
  user: { fname?: string | null; lname?: string | null } | null | undefined,
): string {
  const initials = `${user?.fname?.trim().charAt(0) ?? ""}${user?.lname?.trim().charAt(0) ?? ""}`;
  return initials.toUpperCase() || "P";
}

/** Brand teal→green, shared by the header and profile avatars. */
export const AVATAR_BACKGROUND =
  "linear-gradient(135deg, #0097a7 0%, #00838f 55%, #0a9137 130%)";
