import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Sparkles,
  Zap,
  Bot,
  LayoutTemplate,
  Search,
  PenTool
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      {/* ── Sticky Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              ResumeAI
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-indigo-600 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it works</Link>
            <Link href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20">
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero Section ───────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
            />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-600 ring-1 ring-inset ring-indigo-600/20 mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                  </span>
                  Top-rated ATS Optimization
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl mb-6">
                  Your Resume, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                    Perfected by AI.
                  </span>
                </h1>
                <p className="text-lg leading-8 text-slate-600 mb-8 max-w-lg">
                  Beat the ATS, write convincing cover letters, and land your dream job with
                  the world's most advanced resume toolkit powered by Gemini 2.5 Flash.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/25 h-12 px-8 text-base">
                    <Link href="/sign-up">
                      Get Started for Free <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base bg-white/50 backdrop-blur border-slate-200 hover:bg-white hover:text-indigo-600">
                    <Link href="#features">
                      View Features
                    </Link>
                  </Button>
                </div>
                <div className="mt-8 flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200" style={{ backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 10})`, backgroundSize: 'cover' }}></div>
                    ))}
                  </div>
                  <p>Loved by 10,000+ job seekers</p>
                </div>
              </div>

              {/* Hero Visual */}
              <div className="relative lg:h-[600px] w-full hidden lg:block">
                <div className="absolute top-10 left-10 right-0 bottom-0 bg-slate-100 rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 w-full h-12 bg-white border-b border-slate-100 flex items-center px-4 gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400"></div>
                    <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="p-8 pt-20">
                    <div className="w-full h-4 bg-slate-200 rounded mb-4 w-3/4"></div>
                    <div className="w-full h-4 bg-slate-200 rounded mb-8 w-1/2"></div>

                    <div className="flex gap-4 mb-8">
                      <div className="flex-1 h-32 bg-indigo-50 rounded-xl border border-indigo-100 p-4">
                        <div className="h-8 w-8 bg-indigo-200 rounded-lg mb-2"></div>
                        <div className="h-3 w-16 bg-indigo-200 rounded"></div>
                      </div>
                      <div className="flex-1 h-32 bg-slate-50 rounded-xl border border-slate-100 p-4">
                        <div className="h-8 w-8 bg-slate-200 rounded-lg mb-2"></div>
                        <div className="h-3 w-16 bg-slate-200 rounded"></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="h-2 w-full bg-slate-100 rounded"></div>
                      <div className="h-2 w-full bg-slate-100 rounded"></div>
                      <div className="h-2 w-full bg-slate-100 rounded"></div>
                      <div className="h-2 w-5/6 bg-slate-100 rounded"></div>
                    </div>

                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute top-[55%] -right-6 z-20 bg-white p-4 rounded-xl shadow-xl border border-slate-100 animate-bounce delay-700 duration-[3000ms]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">ATS Score</p>
                      <p className="text-xs text-slate-500">98/100 Excellent</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features Bento Grid ────────────────────────────────────────────────── */}
        <section id="features" className="py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-base font-semibold leading-7 text-indigo-600">Features</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Everything you need to get hired.
              </p>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                We've built a suite of tools to help you optimize every part of your job application process.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="col-span-1 md:col-span-2 relative overflow-hidden rounded-3xl bg-slate-50 border border-slate-200 p-8 hover:shadow-lg transition-shadow duration-300 group">
                <div className="relative z-10">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Smart ATS Scanner</h3>
                  <p className="text-slate-600 max-w-md">
                    Upload your resume and the job description. Our AI analyzes keywords, formatting,
                    and relevance to give you a match score and actionable feedback.
                  </p>
                </div>
                <div className="absolute right-0 bottom-0 h-48 w-48 opacity-10">
                  <FileText className="h-full w-full text-blue-600" />
                </div>
              </div>

              {/* Feature 2 */}
              <div className="col-span-1 relative overflow-hidden rounded-3xl bg-indigo-600 text-white p-8 hover:shadow-xl transition-shadow duration-300 group">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-indigo-500 blur-2xl"></div>
                <div className="relative z-10">
                  <div className="h-12 w-12 rounded-xl bg-white/20 text-white flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Instant Cover Letters</h3>
                  <p className="text-indigo-100">
                    Generate a personalized, persuasive cover letter in seconds. tailored specifically to the company and role.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="col-span-1 md:col-span-1 relative overflow-hidden rounded-3xl bg-slate-50 border border-slate-200 p-8 hover:shadow-lg transition-shadow duration-300 md:row-span-2 group">
                <div className="relative z-10">
                  <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                    <LayoutTemplate className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Resume Builder</h3>
                  <p className="text-slate-600 mb-6">
                    Create a professional resume from scratch using our drag-and-drop builder with predefined, ATS-friendly templates.
                  </p>
                  <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                    <div className="h-2 w-12 bg-purple-100 rounded mb-2"></div>
                    <div className="h-2 w-24 bg-slate-100 rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-1.5 w-full bg-slate-50 rounded"></div>
                      <div className="h-1.5 w-full bg-slate-50 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="col-span-1 md:col-span-2 relative overflow-hidden rounded-3xl bg-slate-900 text-slate-300 p-8 hover:shadow-lg transition-shadow duration-300 group">
                <div className="grid sm:grid-cols-2 gap-8 items-center">
                  <div className="relative z-10">
                    <div className="h-12 w-12 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                      <Bot className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Powered by Gemini 2.5 Flash</h3>
                    <p className="text-slate-400">
                      Leveraging Google's most efficient multimodal model for lightning-fast analysis and human-like writing suggestions.
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 font-mono text-xs">
                      <p className="text-emerald-400">$ analyzing_resume...</p>
                      <p className="text-slate-500 mt-1">{`>`} extracting keywords</p>
                      <p className="text-slate-500">{`>`} comparing with JD</p>
                      <p className="text-emerald-400 mt-2">{`>`} optimization complete (98%)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA Section ────────────────────────────────────────────────────────── */}
        <section className="py-20 bg-indigo-600">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
              Ready to land your dream job?
            </h2>
            <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto">
              Join thousands of professionals who improved their resume score and got hired faster with ResumeAI.
            </p>
            <Button size="lg" asChild className="bg-white text-indigo-600 hover:bg-slate-100 h-14 px-8 text-lg font-semibold shadow-xl">
              <Link href="/sign-up">Start Building for Free</Link>
            </Button>
            <p className="mt-6 text-sm text-indigo-200">
              No credit card required • Free plan available
            </p>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────────────────── */}
        <footer className="bg-slate-50 py-12 border-t border-slate-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-white">
                <Sparkles className="h-3 w-3" />
              </div>
              <span className="text-sm font-semibold text-slate-900">ResumeAI</span>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} ResumeAI. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-slate-500">
              <Link href="#" className="hover:text-indigo-600">Privacy</Link>
              <Link href="#" className="hover:text-indigo-600">Terms</Link>
              <Link href="#" className="hover:text-indigo-600">Contact</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
