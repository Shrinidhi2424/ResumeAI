import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Admin route group layout.
 *
 * Auth Guard: Checks Clerk publicMetadata.role === "admin".
 * If not admin, redirects to the student dashboard.
 */
export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // Check admin role from Clerk publicMetadata
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata as { role?: string })?.role;

    if (role !== "admin") {
        redirect("/dashboard");
    }

    return <>{children}</>;
}
