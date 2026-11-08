import type { IconName } from "@/components/pk/Icon";

/** A list item; `label` is the bold lead-in ("Minimum Order:"). */
export interface PolicyListItem {
  label?: string;
  text: string;
}

export type PolicyBlock =
  | { type: "p"; text: string }
  | { type: "subheading"; text: string }
  | { type: "list"; items: PolicyListItem[] };

export interface PolicySection {
  /** URL hash, e.g. "3-ordering-and-pricing". */
  id: string;
  title: string;
  icon: IconName;
  blocks: PolicyBlock[];
}

export interface PolicyDocument {
  /** Shown on the language switch when a policy has more than one version. */
  language: string;
  title: string;
  lastUpdated: string;
  intro: string[];
  sections: PolicySection[];
}

/** "3. Ordering and Pricing" -> "3-ordering-and-pricing" */
export function sectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** "Label: text" -> { label: "Label:", text: "text" } — how the documents write list items. */
export function labelled(item: string): PolicyListItem {
  const match = /^([^:]{2,60}:)\s+(.*)$/s.exec(item);
  return match ? { label: match[1], text: match[2] } : { text: item };
}
