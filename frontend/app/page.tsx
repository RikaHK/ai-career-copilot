// frontend/app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground transition-colors duration-300 px-6">
      <div className="max-w-3xl text-center space-y-8">
        
        {/* Hero Section */}
        <div className="space-y-4">
          <Badge className="px-3 py-1 text-xs font-bold uppercase tracking-widest bg-blue-600 text-white border-0">
            Powered by Llama 3.1
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter">
            Your Personal <span className="text-blue-600">AI Career Copilot</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The intelligent way to navigate your career. Parse your resume, match with top jobs, generate roadmaps, and practice interviews—all in one place.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="px-8 py-6 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 dark:shadow-none transition-all hover:scale-105">
              Get Started for Free
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg font-bold border-2 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all hover:scale-105">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          {[
            { title: "Smart Parsing", desc: "Turn PDFs into structured insights." },
            { title: "Semantic Matching", desc: "Find jobs that actually fit your skills." },
            { title: "AI Interviewer", desc: "Practice with custom agentic feedback." },
          ].map((f, i) => (
            <div key={i} className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm">
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Small helper for the Badge
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  );
}