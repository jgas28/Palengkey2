import PkInfoPage from "@/components/pk/PkInfoPage";

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
    <PkInfoPage
      kicker="Privacy policy"
      title="Your privacy matters to us."
      description="How we collect, use, and protect your personal data."
      sections={sections.map((section) => ({
        id: section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title: section.title,
        body: section.body,
      }))}
    />
  );
}
