const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const defaultUploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const staffUploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET_STAFF;

export type CloudinaryUploadOptions = {
  /** Defaults to EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET (menu items). */
  uploadPreset?: string;
};

export function getStaffUploadPreset(): string | undefined {
  return staffUploadPreset || defaultUploadPreset;
}

export async function uploadImageToCloudinary(
  base64: string,
  mimeType = 'image/jpeg',
  options?: CloudinaryUploadOptions
): Promise<string> {
  const uploadPreset = options?.uploadPreset ?? defaultUploadPreset;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary is not configured. Add EXPO_PUBLIC_CLOUDINARY_* to .env');
  }

  const formData = new FormData();
  formData.append('file', `data:${mimeType};base64,${base64}`);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Image upload failed (${response.status})`);
  }

  const data = (await response.json()) as { secure_url?: string };
  if (!data.secure_url) {
    throw new Error('Image upload did not return a URL.');
  }

  return data.secure_url;
}
