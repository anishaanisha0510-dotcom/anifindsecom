/**
 * uploadToCloudinary
 * ------------------
 * Uploads a File/Blob to Cloudinary using an *unsigned* upload preset.
 * No backend needed — Cloudinary allows unsigned uploads from the browser.
 *
 * Setup (one-time):
 *  1. Go to https://cloudinary.com and create a free account.
 *  2. Dashboard → Settings → Upload → "Add upload preset"
 *     - Signing mode: Unsigned
 *     - Folder: ani-finds/products  (optional but tidy)
 *     - Allowed formats: jpg,png,webp,gif
 *  3. Copy the preset name & your Cloud Name into .env.local:
 *     NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
 *     NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
 *
 * Returns: { url, publicId } — url is the CDN secure URL for the image.
 */
export async function uploadToCloudinary(file) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset || cloudName === "your_cloud_name") {
    throw new Error(
      "Cloudinary is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env.local file."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "ani-finds/products");
  // Note: "transformation" param is NOT allowed in unsigned uploads.
  // Set transformations (e.g. w_800, f_auto, q_auto) in your Cloudinary
  // upload preset: Dashboard → Settings → Upload → your preset → "Incoming Transformations"

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const res = await fetch(endpoint, { method: "POST", body: formData });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Cloudinary upload failed (${res.status})`);
  }

  const data = await res.json();
  return {
    url: data.secure_url,         // ← save this to Firestore
    publicId: data.public_id,     // ← useful if you ever want to delete
  };
}

/**
 * isBase64Image — returns true if the string is a data: URI (old format).
 * Used to distinguish legacy Base64 images from new Cloudinary URLs.
 */
export function isBase64Image(str) {
  return typeof str === "string" && str.startsWith("data:");
}

/**
 * cloudinaryUrl — builds an optimised Cloudinary URL with transforms.
 * Pass any already-stored Cloudinary URL; for legacy Base64 just returns as-is.
 *
 * @param {string} url    - The stored image value (Cloudinary URL or Base64)
 * @param {object} opts   - { width, height, quality }
 */
export function cloudinaryUrl(url, { width = 800, quality = "auto" } = {}) {
  if (!url || isBase64Image(url)) return url; // can't transform Base64
  // Insert transformation before /upload/
  try {
    return url.replace(
      "/upload/",
      `/upload/w_${width},f_auto,q_${quality}/`
    );
  } catch {
    return url;
  }
}
