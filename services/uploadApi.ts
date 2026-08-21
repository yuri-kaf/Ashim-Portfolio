import { upload } from '@vercel/blob/client';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Uploads an image and returns its public URL.
 *
 * Checks size and type before contacting the server purely to give a fast,
 * clear message; the authoritative limits live in /api/upload.
 */
export const uploadImage = async (file: File): Promise<string> => {
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Use a JPEG, PNG, WebP or AVIF image.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB; the limit is 5 MB.`);
  }

  const blob = await upload(`media/${file.name}`, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
  });

  return blob.url;
};
