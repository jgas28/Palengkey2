import PkPolicyPage from "@/components/pk/PkPolicyPage";
import { termsOfService } from "@/content/policies/termsOfService";

export default function TermsOfService() {
  return (
    <PkPolicyPage
      kicker="Terms and conditions"
      title="The fine print, kept simple."
      description="The terms that apply when you shop with Palengkey."
      versions={[termsOfService]}
    />
  );
}
