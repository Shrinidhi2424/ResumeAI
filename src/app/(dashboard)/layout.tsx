import { DashboardHeader } from "@/components/dashboard-header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            <DashboardHeader />
            {children}
        </div>
    );
}
