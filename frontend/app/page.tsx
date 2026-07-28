"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background overflow-hidden px-6">
      
      {/* --- SHARED BACKGROUND --- */}
      {/* Fixed: Added type casting to prevent the red squiggle error */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.15] dark:opacity-[0.1]" 
        style={{ 
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', 
          backgroundSize: '32px 32px' 
        } as React.CSSProperties}
      >
      </div>

      {/* Animated Mesh Blobs */}
      <div className="mesh-blob w-[500px] h-[500px] bg-blue-500 top-[-100px] left-[-100px] dark:bg-blue-900/40 rounded-full" />
      <div 
        className="mesh-blob w-[400px] h-[400px] bg-indigo-400 bottom-[-50px] right-[-50px] dark:bg-indigo-900/40 rounded-full" 
        style={{ animationDelay: '-5s' } as React.CSSProperties} 
      />

      {/* Floating Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ModeToggle />
      </div>

      <div className="relative z-10 max-w-4xl text-center space-y-10">
        <div className="space-y-4">
          {/* Logo Section */}
          <div className="mx-auto h-16 w-16 rounded-3xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 mb-8 animate-in zoom-in duration-700">
            <span className="text-white text-3xl font-black italic">C</span>
          </div>

          {/* Hero Title */}
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground leading-[0.9]">
            Your AI <br /> <span className="text-blue-600">Career Copilot</span>
          </h1>

          {/* Tagline */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            The intelligent way to navigate your career. Parse resumes, match with jobs, and practice interviews with agentic AI.
          </p>
        </div>

        {/* Primary Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="h-14 px-10 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 border-0">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold border-2 rounded-2xl backdrop-blur-md bg-background/50 transition-all hover:scale-105 active:scale-95">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Secondary Feature Highlight Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          {[
            { title: "Smart Parsing", desc: "Structured data extraction from messy PDFs." },
            { title: "Semantic Match", desc: "Context-aware job discovery using FAISS." },
            { title: "AI Interviewer", desc: "Interactive mock sessions with technical feedback." },
          ].map((f, i) => (
            <div key={i} className="p-8 rounded-3xl border border-border/50 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}