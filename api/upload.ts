import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { error, json, readJson } from './_lib/http.js';
import { isAuthenticated } from './_lib/session.js';

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Mints a short-lived token so the browser uploads straight to Blob.
 *
 * Files do not pass through this function: serverless request bodies cap at
 * 4.5 MB, which a portfolio image can exceed. Type and size limits are set
 * here, server-side, so the client cannot widen them.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isAuthenticated(request, process.env.SESSION_SECRET)) {
    return error('Unauthorized', 401);
  }

  const body = await readJson(request);
  if (!body || typeof body !== 'object') {
    return error('Expected a JSON body', 400);
  }

  try {
    const result = await handleUpload({
      request,
      body: body as HandleUploadBody,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true,
      }),
    });
    return json(result);
  } catch (cause) {
    console.error('Upload token generation failed:', cause);
    return error(cause instanceof Error ? cause.message : 'Upload failed', 400);
  }
}
