"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      
      // Save JWT in cookie for persistence
      document.cookie = `token=${data.access_token}; path=/; max-age=3600`;
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background overflow-hidden px-4">
      
      {/* --- SHARED BACKGROUND --- */}
      {/* Subtle Dot Grid with TypeScript fix */}
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

      {/* Floating Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ModeToggle />
      </div>

      {/* --- LOGIN CARD --- */}
      <Card className="relative z-10 w-full max-w-md border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
        
        <CardHeader className="space-y-2 text-center pb-8 pt-8 text-gray-900 dark:text-white">
          {/* LOGO: Clickable Home Link */}
          <Link href="/" className="mx-auto block group">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 transition-all group-hover:scale-110 group-hover:rotate-3">
              <span className="text-white text-2xl font-black italic">C</span>
            </div>
          </Link>
          
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back</CardTitle>
          <CardDescription className="text-muted-foreground font-medium">
            Continue your journey with AI Career Copilot
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5">
            {error && (
              <div className="p-3 text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-2 text-left">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
              <Input 
                id="email" type="email" placeholder="name@example.com" required 
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-background/50 border-border/50 focus:ring-blue-500 rounded-xl"
              />
            </div>

            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between">
                <Label htmlFor="password"  className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Password</Label>
                <Link href="#" className="text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors">Forgot password?</Link>
              </div>
              <Input 
                id="password" type="password" required 
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-background/50 border-border/50 focus:ring-blue-500 rounded-xl"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-6 pb-10">
            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95" disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Sign In"}
            </Button>
            <div className="text-center text-sm font-medium text-muted-foreground">
              New here?{" "}
              <Link href="/register" className="text-blue-600 font-bold hover:underline underline-offset-4">
                Create an account
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}