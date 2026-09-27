import { useMutation } from "@tanstack/react-query";
import { Spinner } from "@/components/common/LoadingState";
import { deleteProfileImage, uploadProfileImage } from "@/services/api/profile";
import { refreshCurrentUser } from "@/features/profile/refreshCurrentUser";
import { useToastStore } from "@/stores/toastStore";
import { pickProfilePhoto } from "@/utils/camera";

export default function AvatarUpload({ imageUrl }: { imageUrl?: string | null }) {
  const showToast = useToastStore((state) => state.showToast);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadProfileImage(file),
    onSuccess: async ({ message }) => {
      await refreshCurrentUser();
      showToast(message, "success");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Upload failed.", "error");
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => deleteProfileImage(),
    onSuccess: async ({ message }) => {
      await refreshCurrentUser();
      showToast(message, "success");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not remove image.",
        "error",
      );
    },
  });

  const isBusy = uploadMutation.isPending || removeMutation.isPending;

  async function handlePickPhoto() {
    const file = await pickProfilePhoto();
    if (file) uploadMutation.mutate(file);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary-50 shadow-lifted ring-4 ring-surface">
          {isBusy ? (
            <Spinner />
          ) : imageUrl ? (
            <img src={imageUrl} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-primary"
              aria-hidden="true"
            >
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0" />
            </svg>
          )}
        </div>
        <button
          type="button"
          aria-label={imageUrl ? "Change photo" : "Add photo"}
          onClick={() => void handlePickPhoto()}
          className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white shadow-soft transition-transform active:scale-90"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
      </div>

      {imageUrl && (
        <button
          type="button"
          className="text-sm font-semibold text-status-cancelled hover:underline"
          onClick={() => removeMutation.mutate()}
        >
          Remove photo
        </button>
      )}
    </div>
  );
}
