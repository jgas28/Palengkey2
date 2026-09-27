import InfoPageHeader from "@/components/layout/InfoPageHeader";
import InfoSection from "@/components/layout/InfoSection";
import Footer from "@/components/layout/Footer";

const sections = [
  {
    title: "Information We Collect",
    body: "We collect account details (name, email, phone), delivery addresses, order history, payment method preferences, identity verification documents (for verified accounts), and support interactions.",
  },
  {
    title: "How We Use Information",
    body: "Your information is used to process and fulfill orders, calculate delivery routes, improve our services, provide customer support, and send relevant order notifications and updates.",
  },
  {
    title: "Data Security",
    body: "We apply industry-standard technical and organizational safeguards including encryption in transit and at rest, access controls, and regular security reviews to protect your personal data.",
  },
  {
    title: "Data Sharing",
    body: "We do not sell your personal data. We may share limited information with delivery riders and payment processors solely to fulfill your order. All third parties are bound by confidentiality obligations.",
  },
  {
    title: "Your Rights",
    body: "You have the right to access, correct, or delete your personal data at any time. You may also request a copy of your data or withdraw consent for certain processing activities by contacting our support team.",
  },
  {
    title: "Contact Us",
    body: "For privacy-related questions or requests, please contact us through the Help Center or email us at privacy@palengkey.ph.",
  },
];

export default function PrivacyPolicy() {
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
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        }
        title="Privacy Policy"
        description="Your privacy matters to us. This page explains how we collect and use your data."
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
