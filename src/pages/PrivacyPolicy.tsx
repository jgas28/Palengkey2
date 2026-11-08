import PkPolicyPage from "@/components/pk/PkPolicyPage";
import {
  privacyPolicyEnglish,
  privacyPolicyTagalog,
} from "@/content/policies/privacyPolicy";

export default function PrivacyPolicy() {
  return (
    <PkPolicyPage
      kicker="Privacy policy"
      title="Your privacy matters to us."
      description="How we collect, use, and protect your personal data."
      versions={[privacyPolicyEnglish, privacyPolicyTagalog]}
    />
  );
}
