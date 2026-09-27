import InfoPageHeader from "@/components/layout/InfoPageHeader";
import InfoSection from "@/components/layout/InfoSection";
import Footer from "@/components/layout/Footer";

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <InfoPageHeader
        icon={
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        }
        title="Terms of Service"
        description="By using Palengkey, you agree to these terms and conditions."
      />

      <div className="flex flex-col gap-3">
        {sections.map((section) => (
          <InfoSection key={section.title} title={section.title}>
            {section.body}
          </InfoSection>
        ))}
      </div>

      <Footer />
    </div>
  );
}
