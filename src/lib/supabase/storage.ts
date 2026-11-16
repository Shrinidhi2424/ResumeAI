import { createAdminClient } from "@/lib/supabase/server";

const RESUME_BUCKET = "resumes";

/**
 * Get the object path inside the bucket from a Supabase public URL.
 * e.g. ".../storage/v1/object/public/resumes/user_1/abc.pdf" -> "user_1/abc.pdf"
 * Returns null if the URL is not a public URL for this bucket.
 */
export function getStoragePathFromPublicUrl(
    fileUrl: string,
    bucket: string = RESUME_BUCKET
): string | null {
    const marker = `/object/public/${bucket}/`;
    const index = fileUrl.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(fileUrl.slice(index + marker.length));
}

/**
 * Download a resume PDF from Supabase Storage using the server-side
 * admin client (the same client the upload route uses).
 */
export async function downloadResumePdf(fileUrl: string): Promise<Buffer> {
    const path = getStoragePathFromPublicUrl(fileUrl);
    if (!path) {
        throw new Error("Resume file URL is not a Supabase public URL.");
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from(RESUME_BUCKET).download(path);
    if (error || !data) {
        throw new Error(`Failed to download resume PDF: ${error?.message ?? "no data"}`);
    }
    return Buffer.from(await data.arrayBuffer());
}
