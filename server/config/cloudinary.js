import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

let configured = false;

function ensureConfigured() {
  if (configured) return isCloudinaryEnabled();
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });
  }
  configured = true;
  return isCloudinaryEnabled();
}

export function isCloudinaryEnabled() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload a file buffer to Cloudinary. Returns { url, publicId, resourceType }
 * or null when Cloudinary is not configured (so the app still works without it).
 *
 * Files are stored as `raw` with an extension-less public_id. This is important:
 * Cloudinary blocks delivery of files whose public_id ends in .pdf/.docx (a
 * default account security setting), which would make downloads fail with 401.
 * Storing as raw without that extension keeps every resume downloadable.
 */
export function uploadBufferToCloudinary(buffer, originalname) {
  if (!ensureConfigured()) return Promise.resolve(null);

  const safeBase = (originalname || "resume")
    .replace(/\.[^.]+$/, "") // drop extension
    .replace(/[^a-zA-Z0-9_-]+/g, "_") // sanitize
    .slice(0, 60) || "resume";
  const publicId = `ai-resume-grader/resumes/${safeBase}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw", // store bytes verbatim; avoids PDF delivery block
        public_id: publicId,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type, // always "raw" here
        });
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

/**
 * Delete a file from Cloudinary. Uses the stored resourceType when available,
 * otherwise tries the common types so cleanup is reliable.
 */
export async function deleteFromCloudinary(publicId, resourceType) {
  if (!publicId || !ensureConfigured()) return;

  const types = resourceType ? [resourceType] : ["raw", "image", "video"];
  for (const type of types) {
    try {
      const res = await cloudinary.uploader.destroy(publicId, { resource_type: type });
      if (res?.result === "ok") return;
    } catch (err) {
      // Try the next resource type.
      console.warn(`[cloudinary] delete (${type}) failed: ${err.message}`);
    }
  }
}

/**
 * Build a signed, time-limited URL for a private/raw asset so the backend can
 * fetch it for download. Returns null when not configured.
 */
export function buildAssetUrl(publicId, resourceType = "raw") {
  if (!publicId || !ensureConfigured()) return null;
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
    sign_url: true,
  });
}
