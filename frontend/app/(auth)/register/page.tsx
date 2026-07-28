"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Registration failed");
      router.push("/login");
    } catch (err) { console.error(err); } 
    finally { setIsLoading(false); }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background overflow-hidden px-4">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 z-0 opacity-[0.15] dark:opacity-[0.1]" 
           style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>
      <div className="mesh-blob w-[400px] h-[400px] bg-blue-500 top-[-100px] left-[-100px] dark:bg-blue-900/40 rounded-full" />
      <div className="mesh-blob w-[300px] h-[300px] bg-indigo-400 bottom-[-50px] right-[-50px] dark:bg-indigo-900/40 rounded-full" style={{ animationDelay: '-5s' }} />

      <div className="absolute top-6 right-6 z-20">
        <ModeToggle />
      </div>

      <Card className="relative z-10 w-full max-w-md border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
        
        <CardHeader className="space-y-2 text-center pb-8 pt-8">
          <Link href="/" className="mx-auto block group">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
              <span className="text-white text-2xl font-black">C</span>
            </div>
          </Link>
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Create Account</CardTitle>
          <CardDescription className="text-muted-foreground font-medium">Join the next generation of career tools</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-5">
            <div className="space-y-2 text-left">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email</Label>
              <Input type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-background/50 rounded-xl" />
            </div>
            <div className="space-y-2 text-left">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Password</Label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-background/50 rounded-xl" />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-6 pb-10">
            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
            <div className="text-center text-sm font-medium text-muted-foreground">
              Already have an account? <Link href="/login" className="text-blue-600 font-bold hover:underline">Sign In</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}