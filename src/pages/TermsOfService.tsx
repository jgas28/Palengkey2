import PkInfoPage from "@/components/pk/PkInfoPage";

const sections = [
  {
    title: "Acceptance of Terms",
    body: "By accessing or using the Palengkey platform, you agree to be bound by these Terms of Service. If you do not agree, please discontinue use immediately.",
  },
  {
    title: "Use of Service",
    body: "You agree to provide accurate, current information when creating an account or placing orders. The platform must be used lawfully and not for any fraudulent, harmful, or unauthorized purposes.",
  },
  {
    title: "Orders and Payments",
    body: "Prices and product availability may change without prior notice. Payment obligations apply upon confirmed order placement. All prices are in Philippine Peso (₱) and are inclusive of applicable taxes.",
  },
  {
    title: "Delivery & Freshness Guarantee",
    body: "Palengkey guarantees the freshness of all products. If an item does not meet freshness standards, report it within 30 minutes of delivery for a refund or replacement. We are not liable for delays caused by weather, road conditions, or other factors beyond our control.",
  },
  {
    title: "Account Responsibility",
    body: "You are responsible for maintaining the security of your account credentials. Any activity conducted through your account is your responsibility. Notify us immediately if you suspect unauthorized access.",
  },
  {
    title: "Limitations of Liability",
    body: "Service disruptions may occur due to factors beyond our control including but not limited to technical failures, natural events, or regulatory actions. Palengkey's liability is limited to the value of the affected order.",
  },
  {
    title: "Changes to Terms",
    body: "We reserve the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms. We will notify users of material changes via email or app notification.",
  },
];

export default function TermsOfService() {
  return (
    <PkInfoPage
      kicker="Terms of service"
      title="The fine print, kept simple."
      description="The terms that apply when you shop with Palengkey."
      sections={sections.map((section) => ({
        id: section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title: section.title,
        body: section.body,
      }))}
    />
  );
}
