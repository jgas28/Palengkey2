import ProfileSubPage from "@/features/profile/ProfileSubPage";
import DeleteAccountForm from "@/features/profile/DeleteAccountForm";

export default function DeleteAccount() {
  return (
    <ProfileSubPage kicker="Account" title="Delete account" description="Permanently remove your Palengkey account.">
      <DeleteAccountForm />
    </ProfileSubPage>
  );
}
