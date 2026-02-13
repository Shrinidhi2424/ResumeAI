import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileSearch, FileText, Briefcase, PenTool } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
    const user = await currentUser();

    if (!user) {
        redirect("/sign-in");
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl space-y-12">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Welcome back, {user.firstName || "Student"}!
                    </h1>
                    <p className="text-lg text-slate-600">
                        Here's what you can do with ResumeAI today.
                    </p>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* New Scan */}
                    <Link href="/upload" className="block h-full">
                        <Card className="h-full transition-shadow hover:shadow-md cursor-pointer border-indigo-100 hover:border-indigo-300">
                            <CardHeader>
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                                    <FileSearch size={24} />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle>New Scan</CardTitle>
                                    <CardDescription>
                                        Analyze a resume against a job description.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button variant="ghost" className="w-full justify-start pl-0 text-indigo-600 hover:text-indigo-700">
                                    Start Analysis →
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Resume Builder */}
                    <Link href="/builder" className="block h-full">
                        <Card className="h-full transition-shadow hover:shadow-md cursor-pointer border-emerald-100 hover:border-emerald-300">
                            <CardHeader>
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                    <FileText size={24} />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle>Resume Builder</CardTitle>
                                    <CardDescription>
                                        Create and edit ATS-friendly resumes.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button variant="ghost" className="w-full justify-start pl-0 text-emerald-600 hover:text-emerald-700">
                                    Build Resume →
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Application Tracker */}
                    <Link href="/tracker" className="block h-full">
                        <Card className="h-full transition-shadow hover:shadow-md cursor-pointer border-blue-100 hover:border-blue-300">
                            <CardHeader>
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                    <Briefcase size={24} />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle>Application Tracker</CardTitle>
                                    <CardDescription>
                                        Manage your job applications (Kanban).
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button variant="ghost" className="w-full justify-start pl-0 text-blue-600 hover:text-blue-700">
                                    View Tracker →
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Cover Letter */}
                    <Link href="/cover-letter" className="block h-full">
                        <Card className="h-full transition-shadow hover:shadow-md cursor-pointer border-purple-100 hover:border-purple-300">
                            <CardHeader>
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                                    <PenTool size={24} />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle>Cover Letter AI</CardTitle>
                                    <CardDescription>
                                        Generate tailored cover letters in seconds.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button variant="ghost" className="w-full justify-start pl-0 text-purple-600 hover:text-purple-700">
                                    Write Letter →
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </main>
    );
}
