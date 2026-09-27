import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

/** Lets the customer choose Camera or Photo Library, explicitly requesting
 * whichever permission is needed first. Returns null if permission is denied,
 * the picker is cancelled, or the photo can't be converted to a File. */
export async function pickProfilePhoto(): Promise<File | null> {
  try {
    const permission = await Camera.checkPermissions();
    if (permission.camera !== "granted" || permission.photos !== "granted") {
      const requested = await Camera.requestPermissions({ permissions: ["camera", "photos"] });
      if (requested.camera !== "granted" && requested.photos !== "granted") return null;
    }

    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
      quality: 85,
    });

    if (!photo.webPath) return null;

    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    const extension = photo.format || "jpeg";
    return new File([blob], `profile.${extension}`, { type: blob.type || `image/${extension}` });
  } catch {
    // Cancelled by the user, or no camera/gallery available — not an error.
    return null;
  }
}
