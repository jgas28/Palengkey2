import ProfileSubPage from "@/features/profile/ProfileSubPage";
import EditProfileForm from "@/features/profile/EditProfileForm";

export default function EditProfile() {
  return (
    <ProfileSubPage kicker="Your account" title="Edit profile" description="Keep your name and mobile number up to date.">
      <EditProfileForm />
    </ProfileSubPage>
  );
}
