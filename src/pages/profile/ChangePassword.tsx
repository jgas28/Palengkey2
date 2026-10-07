import ProfileSubPage from "@/features/profile/ProfileSubPage";
import ChangePasswordForm from "@/features/profile/ChangePasswordForm";

export default function ChangePassword() {
  return (
    <ProfileSubPage kicker="Security" title="Change password" description="Use at least 8 characters with a mix of letters and numbers.">
      <ChangePasswordForm />
    </ProfileSubPage>
  );
}
