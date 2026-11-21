import ProfileSubPage from "@/features/profile/ProfileSubPage";
import DiscountIdPanel from "@/features/discountId/DiscountIdPanel";

export default function DiscountIdPage() {
  return (
    <ProfileSubPage
      kicker="Discounts"
      title="PWD / Senior Citizen discount"
      description="Upload your ID once. After we approve it, you get 20% off the delivery fee (VAT-exclusive) when you turn on the discount at checkout."
    >
      <DiscountIdPanel />
    </ProfileSubPage>
  );
}
