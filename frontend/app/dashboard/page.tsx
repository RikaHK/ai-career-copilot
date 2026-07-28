// frontend/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  History, 
  FileText, 
  PlusCircle, 
  LogOut, 
  Sparkles, 
  UploadCloud, 
  CheckCircle2, 
  Target, 
  Zap, 
  BrainCircuit, 
  BarChart3, 
  Loader2,
  Trophy,
  ArrowRight
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  
  // --- CORE SYSTEM STATE ---
  const [isMounted, setIsMounted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [matchedJobs, setMatchedJobs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // --- CUSTOM JD MATCHING STATE ---
  const [customJD, setCustomJD] = useState("");
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState(false);

  // --- ROADMAP & INSIGHTS STATE ---
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [roadmapText, setRoadmapText] = useState("");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  
  // --- INTERVIEW WORKSPACE STATE ---
  const [isInterviewOpen, setIsInterviewOpen] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);
  const [isGeneratingInterview, setIsGeneratingInterview] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({});
  const [feedbackData, setFeedbackData] = useState<{[key: number]: any}>({});
  const [isEvaluating, setIsEvaluating] = useState<{[key: number]: boolean}>({});

  // Utility to safely grab the token from cookies
  const getAuthToken = () => {
    if (typeof document === "undefined") return "";
    return document.cookie.split("token=")[1]?.split(";")[0] ?? "";
  };

  // --- INITIALIZATION & PERSISTENCE ---
  useEffect(() => {
    setIsMounted(true);

    const initializeDashboard = async () => {
      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      // 1. Load the most recent resume session
      try {
        const res = await fetch("http://localhost:8000/get-resume", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.resume_json) {
          setResumeData(data.resume_json);
          await triggerJobMatching(data.resume_json);
        }
      } catch (err) {
        console.error("Failed to load persistent resume", err);
      }

      // 2. Fetch the full history list
      await fetchHistory(token);
    };

    initializeDashboard();
  }, []);

  const fetchHistory = async (token?: string) => {
    try {
      const authToken = token || getAuthToken();
      const res = await fetch("http://localhost:8000/get-history", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        // Sort by date newest first
        setHistory(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (err) {
      console.error("Failed to fetch history sidebar", err);
    }
  };

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  };

  // --- PRIMARY ACTION: RESUME PROCESSING ---
  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    
    // Clear current view
    setResumeData(null);
    setMatchedJobs([]);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = getAuthToken();
      
      // Step A: Parse PDF with Local LLM
      const parseRes = await fetch("http://localhost:8000/upload-resume", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!parseRes.ok) throw new Error("Resume parsing failed");
      const data = await parseRes.json();
      const extractedData = data.parsed_data;
      setResumeData(extractedData);

      // Step B: Update Persistent History Sidebar
      await fetchHistory(token);

      // Step C: Trigger Semantic Job Matcher
      await triggerJobMatching(extractedData);

    } catch (error) {
      console.error("Critical Upload Error:", error);
      alert("AI analysis failed. Ensure backend and Ollama are running.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- SECONDARY ACTION: MANUAL JD SCORING ---
  const handleCustomAnalysis = async () => {
    if (!customJD || !resumeData) return;
    setIsAnalyzingCustom(true);

    try {
      // Calculate real-time semantic distance for this specific string
      const res = await fetch("http://localhost:8000/match-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_data: resumeData,
          job_description: customJD
        }),
      });
      const data = await res.json();

      const virtualJob = {
        id: `custom-${Date.now()}`,
        title: "Manual Target Role",
        company: "Direct Opportunity",
        description: customJD,
        match_percentage: data.match_percentage,
      };

      // Add to the front of the list for immediate focus
      setMatchedJobs((prev) => [virtualJob, ...prev]);
      setCustomJD(""); 
    } catch (err) {
      console.error("Custom analysis failed", err);
    } finally {
      setIsAnalyzingCustom(false);
    }
  };

  // --- CORE ENGINE: JOB MATCHING ---
  const triggerJobMatching = async (data: any) => {
    try {
      const matchRes = await fetch("http://localhost:8000/match-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!matchRes.ok) throw new Error("FAISS matching failed");
      const matchData = await matchRes.json();
      setMatchedJobs(matchData.matches);
    } catch (err) {
      console.error("Job Matcher Error", err);
    }
  };

  // --- HISTORY MANAGEMENT ---
  const loadFromHistory = async (item: any) => {
    setResumeData(item.resume_data);
    setMatchedJobs([]); // Reset matches for visual update
    await triggerJobMatching(item.resume_data);
  };

  // --- COACHING: GENERATE ROADMAP ---
  const fetchRoadmap = async (job: any) => {
    setSelectedJob(job);
    setRoadmapText(""); 
    setIsRoadmapOpen(true);

    try {
      const response = await fetch("http://localhost:8000/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_skills: resumeData.skills,
          job_title: job.title,
          job_requirements: job.description,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setRoadmapText((prev) => prev + chunk);
        }
      }
    } catch (error) {
      console.error("Roadmap generation failed", error);
    }
  };

  // --- SIMULATION: INTERVIEW QUESTIONS ---
  const fetchInterview = async (job: any) => {
    setSelectedJob(job);
    setIsGeneratingInterview(true);
    setIsInterviewOpen(true);
    setInterviewQuestions([]);
    setUserAnswers({}); 
    setFeedbackData({}); 

    try {
      const res = await fetch("http://localhost:8000/generate-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_data: resumeData,
          job_title: job.title,
          job_description: job.description,
        }),
      });
      const data = await res.json();
      setInterviewQuestions(data.questions);
    } catch (error) {
      console.error("Interview Question Error", error);
    } finally {
      setIsGeneratingInterview(false);
    }
  };

  // --- SIMULATION: SUBMIT ANSWER ---
  const submitAnswer = async (index: number, question: string) => {
    setIsEvaluating(prev => ({ ...prev, [index]: true }));
    
    try {
      const res = await fetch("http://localhost:8000/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question,
          user_answer: userAnswers[index],
          job_title: selectedJob?.title
        }),
      });
      const data = await res.json();
      setFeedbackData(prev => ({ ...prev, [index]: data }));
    } catch (error) {
      console.error("Evaluation Error", error);
    } finally {
      setIsEvaluating(prev => ({ ...prev, [index]: false }));
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background transition-colors duration-300">
      
      {/* --- SIDEBAR WORKSPACE --- */}
      <aside className="w-72 flex-shrink-0 border-r bg-card flex flex-col">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-500/20 text-xl">C</div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tighter text-lg leading-tight">Copilot History</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Multi-Session Data</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <Button variant="outline" className="w-full justify-start gap-2 mb-6 border-blue-500/20 hover:bg-blue-500/10 rounded-xl py-6" onClick={() => {setResumeData(null); setMatchedJobs([]);}}>
            <PlusCircle size={18} /> <span className="font-bold tracking-tight">New Analysis</span>
          </Button>
          
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 mb-4">Past Sessions</div>
          {history.length === 0 ? (
            <div className="flex flex-col items-center py-10 opacity-30">
               <Loader2 className="animate-spin mb-2" size={16} />
               <span className="text-[10px] font-bold uppercase">No records found</span>
            </div>
          ) : (
            history.map((item) => (
              <button 
                key={item.id} 
                onClick={() => loadFromHistory(item)} 
                className="w-full text-left p-3 rounded-xl hover:bg-muted transition-all group flex items-center gap-3 border border-transparent hover:border-blue-500/20"
              >
                <FileText size={16} className="text-blue-500 opacity-60 group-hover:opacity-100" />
                <div className="truncate">
                  <p className="text-sm font-bold truncate opacity-80 group-hover:opacity-100">{item.filename}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t space-y-4">
           <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Theme</span>
              <ModeToggle />
           </div>
           <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:bg-red-500/10 rounded-xl font-bold" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </Button>
        </div>
      </aside>

      {/* --- MAIN DASHBOARD CANVAS --- */}
      <main className="flex-1 overflow-y-auto p-12 relative">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' } as React.CSSProperties} />

        <div className="max-w-6xl mx-auto space-y-12 relative z-10">
          
          <div className="flex flex-col gap-2 border-b-2 border-muted pb-8">
            <h1 className="text-6xl font-black text-foreground tracking-tighter">Career Copilot</h1>
            <p className="text-lg text-muted-foreground font-medium flex items-center gap-2"><Zap size={18} className="text-blue-600" /> Intelligent career analysis workspace.</p>
          </div>

          {/* PERSISTENT UPLOAD ZONE */}
          <div className={`p-10 border-2 border-dashed rounded-[2.5rem] transition-all duration-700 ${!resumeData ? 'bg-muted/20 py-24 border-blue-500/30' : 'bg-card/50 py-10 border-muted'}`}>
            <div className="flex flex-col items-center justify-center space-y-6">
              {!resumeData && (
                <div className="h-20 w-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 animate-bounce">
                  <UploadCloud size={40} />
                </div>
              )}
              <div className="text-center">
                <h2 className={`font-black text-foreground tracking-tight ${!resumeData ? 'text-4xl' : 'text-xl'}`}>{!resumeData ? 'Upload Resume to Begin' : 'Update Technical Resume'}</h2>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg">
                <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-xs text-muted-foreground file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:bg-blue-600 file:text-white cursor-pointer w-full font-black bg-background rounded-full p-2 border border-muted" />
                <Button onClick={handleUpload} disabled={!file || isUploading} size="lg" className="px-10 h-14 text-lg font-black bg-blue-600 hover:bg-blue-700 text-white rounded-[1.25rem] shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                  {isUploading ? "SCANNING..." : "PROCESS CV"}
                </Button>
              </div>
            </div>
          </div>

        {resumeData && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            
            {/* MANUAL TARGET ROLE INPUT */}
            <div className="p-10 rounded-[2.5rem] border border-blue-500/20 bg-blue-500/5 backdrop-blur-md shadow-lg group">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform"><Target size={24} className="text-white" /></div>
                <div>
                  <h3 className="text-3xl font-black tracking-tighter">Target a Specific Role</h3>
                  <p className="text-muted-foreground font-medium text-left">Paste a job description from any listing to generate custom technical insights.</p>
                </div>
              </div>
              <textarea 
                className="w-full p-8 rounded-3xl border border-muted bg-background text-base focus:ring-8 focus:ring-blue-500/5 outline-none transition-all mb-6 min-h-[180px] font-medium leading-relaxed shadow-inner" 
                placeholder="Paste the Job Description (JD) here..." 
                value={customJD} 
                onChange={(e) => setCustomJD(e.target.value)} 
              />
              <Button onClick={handleCustomAnalysis} disabled={!customJD || isAnalyzingCustom} className="h-14 bg-blue-600 hover:bg-blue-700 text-white font-black px-12 rounded-2xl shadow-2xl text-lg uppercase tracking-widest transition-all">
                {isAnalyzingCustom ? "CALCULATING..." : "Analyze This Role"}
              </Button>
            </div>

            {/* AUTOMATED JOB MATCHING GRID */}
            {matchedJobs.length > 0 && (
              <div className="space-y-8">
                <h3 className="text-4xl font-black tracking-tighter flex items-center gap-4"><span className="bg-blue-600 text-white p-2 rounded-2xl text-lg shadow-xl italic">🚀</span> Strategic Job Matches</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {matchedJobs.map((job, i) => (
                    <div key={job.id} className="relative p-10 border border-muted rounded-[3rem] bg-card hover:border-blue-500/40 transition-all duration-500 shadow-xl group">
                      <div className={`absolute -top-4 right-10 text-white text-xs font-black px-6 py-2 rounded-full shadow-2xl ${job.id.toString().includes('custom') ? "bg-orange-500 animate-pulse" : "bg-blue-600"}`}>
                        {job.id.toString().includes('custom') ? `🔥 ${job.match_percentage}% MATCH` : `${job.match_percentage}% MATCH`}
                      </div>
                      <h4 className="font-black text-2xl mb-2 truncate pr-10 tracking-tight text-left">{job.title}</h4>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em] mb-6 text-left">{job.company}</p>
                      <p className="text-xs text-muted-foreground line-clamp-5 mb-10 leading-loose font-medium opacity-80 text-left">{job.description}</p>
                      <div className="space-y-3">
                        <Button variant="outline" size="lg" className="w-full h-14 rounded-2xl border-blue-500/30 text-blue-600 font-black tracking-widest text-[10px] hover:bg-blue-500/10" onClick={() => fetchRoadmap(job)}>GAP ANALYSIS</Button>
                        <Button variant="default" size="lg" className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 font-black tracking-widest text-[10px]" onClick={() => fetchInterview(job)}>PRACTICE INTERVIEW</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RELATIONAL DATA SECTIONS (SUMMARY, SKILLS, EXP) */}
            <div className="border-t-4 border-muted pt-16 grid grid-cols-1 lg:grid-cols-12 gap-16 text-left">
                {/* Profile Pillar (Left) */}
                <div className="lg:col-span-5 space-y-12 text-left">
                   {resumeData.summary && (
                      <div className="bg-blue-500/10 border border-blue-500/20 p-10 rounded-[3rem] shadow-lg relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-110 transition-transform"><BrainCircuit size={200} /></div>
                        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-6">Executive Summary</h3>
                        <p className="text-xl leading-relaxed font-bold italic text-foreground/90 text-left">"{resumeData.summary}"</p>
                      </div>
                    )}
                    
                    <section>
                      <h3 className="text-2xl font-black mb-8 uppercase tracking-tighter border-b-4 border-blue-600/20 pb-4 flex items-center gap-3"><Zap size={20} className="text-blue-600" /> Extracted Expertise</h3>
                      <div className="flex flex-wrap gap-3">
                        {resumeData.skills.map((skill: string, index: number) => (
                          <Badge key={index} variant="secondary" className="px-4 py-2 rounded-xl bg-muted text-foreground border border-muted-foreground/10 font-black text-[11px] uppercase tracking-widest shadow-sm hover:scale-105 transition-transform">{skill}</Badge>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-2xl font-black mb-8 uppercase tracking-tighter border-b-4 border-blue-600/20 pb-4 flex items-center gap-3"><Trophy size={20} className="text-blue-600" /> Education</h3>
                      <div className="space-y-4">
                        {resumeData.education.map((edu: any, i: number) => (
                          <div key={i} className="p-8 border rounded-[2.5rem] bg-muted/10">
                            <h4 className="font-black text-foreground text-xl leading-tight mb-2 text-left">{edu.degree}</h4>
                            <p className="text-sm font-bold text-blue-600 text-left">{edu.institution}</p>
                            <p className="text-[10px] text-muted-foreground mt-4 font-black uppercase tracking-widest text-left">{edu.year}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                </div>

                {/* Technical Journey (Right) */}
                <div className="lg:col-span-7 space-y-12 text-left">
                   <section>
                      <h3 className="text-3xl font-black mb-8 uppercase tracking-tighter border-b-4 border-blue-600/20 pb-4 flex items-center gap-3"><History size={24} className="text-blue-600" /> Professional Journey</h3>
                      <div className="space-y-8">
                        {resumeData.experience.map((exp: any, i: number) => (
                          <div key={i} className="p-10 border rounded-[3rem] bg-card shadow-lg hover:border-blue-500/20 transition-all text-left">
                            <h4 className="font-black text-foreground text-2xl tracking-tight leading-none text-left">{exp.title}</h4>
                            <div className="flex justify-between items-center mt-4 mb-8">
                              <span className="text-sm text-blue-600 font-black uppercase tracking-widest">{exp.company}</span>
                              <span className="text-[10px] text-muted-foreground font-black bg-muted px-4 py-1.5 rounded-full">{exp.period}</span>
                            </div>
                            <ul className="space-y-4">
                              {exp.responsibilities.map((task: string, j: number) => (
                                <li key={j} className="text-sm leading-relaxed opacity-70 font-medium flex gap-3 italic text-left">
                                   <span className="text-blue-500 font-black">•</span> {task}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                   </section>

                   <section>
                      <h3 className="text-3xl font-black mb-8 uppercase tracking-tighter border-b-4 border-blue-600/20 pb-4 flex items-center gap-3"><BarChart3 size={24} className="text-blue-600" /> Engineering Projects</h3>
                      <div className="grid grid-cols-1 gap-6 text-left">
                        {resumeData.projects.map((proj: any, i: number) => (
                          <div key={i} className="p-10 border border-blue-500/10 rounded-[3rem] bg-blue-500/[0.03] shadow-lg text-left">
                            <h4 className="font-black text-foreground text-2xl mb-6 tracking-tight leading-none text-left">{proj.name}</h4>
                            <ul className="space-y-4">
                              {proj.details.map((detail: string, j: number) => (
                                <li key={j} className="text-sm leading-relaxed opacity-80 font-medium flex gap-3 text-left">
                                   <span className="text-blue-500 font-black">»</span> {detail}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                   </section>
                </div>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* --- ROADMAP DIALOG (DESKTOP WIDE-VIEW) --- */}
      <Dialog open={isRoadmapOpen} onOpenChange={setIsRoadmapOpen}>
          <DialogContent className="!max-w-7xl !w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-background rounded-[3rem] border-blue-500/20 shadow-2xl">
             <div className="flex-shrink-0 bg-blue-600 p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Sparkles size={200} /></div>
                <Badge className="bg-white/20 text-white border-0 mb-6 px-6 py-1.5 uppercase tracking-[0.3em] text-[10px] font-black rounded-full">Strategic Intelligence</Badge>
                <DialogTitle className="text-5xl font-black tracking-tighter mb-4 leading-none italic">Skill Gap & Strategic Path</DialogTitle>
                <DialogDescription className="text-blue-100 text-xl font-medium max-w-3xl leading-relaxed text-left">Analysis for <span className="font-black underline decoration-white/40 underline-offset-8 italic">{selectedJob?.title}</span>.</DialogDescription>
             </div>

             <div className="flex-1 overflow-y-auto p-16 grid grid-cols-1 lg:grid-cols-12 gap-20 text-left bg-card/20">
                <div className="lg:col-span-5 space-y-10 border-r border-muted/30 pr-20 text-left">
                   <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.4em] mb-8 border-b-2 border-blue-600/10 pb-4 text-left">Comparative Analysis</h3>
                   <div className="prose prose-sm dark:prose-invert prose-blue max-w-none font-bold leading-loose text-lg text-foreground text-left"><ReactMarkdown>{roadmapText.split('4-Week')[0] || "Synthesizing data points..."}</ReactMarkdown></div>
                </div>
                <div className="lg:col-span-7 text-left">
                   <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.4em] mb-10 border-b-2 border-blue-600/10 pb-4 text-left">Accelerated 4-Week Sprint</h3>
                   <div className="prose prose-blue dark:prose-invert max-w-none prose-headings:text-blue-600 prose-headings:font-black prose-headings:text-3xl prose-headings:mb-8 prose-li:list-none prose-li:p-8 prose-li:bg-muted/40 prose-li:rounded-[2.5rem] prose-li:mb-6 prose-li:border-2 prose-li:border-muted/50 prose-li:shadow-xl text-left font-bold"><ReactMarkdown>{roadmapText.includes('4-Week') ? 'Week' + roadmapText.split('4-Week')[1] : "Calculating learning curves..."}</ReactMarkdown></div>
                </div>
             </div>
          </DialogContent>
        </Dialog>

        {/* --- INTERVIEW DIALOG (FULL-WORKSPACE-WORKSPACE) --- */}
        <Dialog open={isInterviewOpen} onOpenChange={setIsInterviewOpen}>
          <DialogContent className="!max-w-[98vw] !w-[98vw] h-[95vh] flex flex-col p-0 overflow-hidden bg-background rounded-[3.5rem] border-muted shadow-2xl">
            <div className="flex-shrink-0 flex items-center justify-between px-12 py-8 border-b bg-card/50">
               <div className="flex items-center gap-6">
                  <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl italic font-black text-2xl">C</div>
                  <div><DialogTitle className="text-4xl font-black tracking-tighter uppercase italic leading-none">Simulation Environment</DialogTitle></div>
               </div>
               <Badge className="px-6 py-2 rounded-full bg-blue-600 text-white font-black tracking-widest text-[10px]">ACTIVE WORKSPACE</Badge>
            </div>
            <div className="flex-1 flex overflow-hidden">
              <aside className="w-1/4 border-r bg-muted/5 overflow-y-auto p-10 space-y-8 flex-shrink-0 text-left">
                <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-6">Simulation Index</h3>
                {isGeneratingInterview ? <div className="space-y-6 animate-pulse">{[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-muted rounded-[2rem]" />)}</div> :
                  interviewQuestions.map((q, i) => (
                    <div key={i} className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 shadow-sm ${feedbackData[i] ? 'bg-green-600/10 border-green-600/30' : 'bg-card border-muted hover:border-blue-500/30'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">{q.type}</span>
                        {feedbackData[i] && <CheckCircle2 size={18} className="text-green-600" />}
                      </div>
                      <p className="text-sm font-bold leading-snug italic opacity-80 tracking-tight text-left">"{q.question}"</p>
                    </div>
                  ))
                }
              </aside>
              <div className="flex-1 overflow-y-auto p-16 bg-card/10">
                <div className="max-w-4xl mx-auto space-y-24 pb-32">
                  {interviewQuestions.map((q, i) => (
                    <div key={i} className="space-y-12 animate-in slide-in-from-right-12 duration-1000 text-left">
                      <div className="space-y-6 text-left">
                        <span className="text-6xl font-black italic opacity-10 tracking-tighter block text-left">TASK 0{i+1}</span>
                        <h4 className="text-5xl font-black tracking-tighter leading-[1.1] text-left">"{q.question}"</h4>
                        <div className="p-6 bg-blue-600/10 border-2 border-blue-600/20 rounded-3xl text-left"><p className="text-xs text-blue-600 font-black uppercase tracking-[0.2em] leading-relaxed italic text-left">System Context: {q.context}</p></div>
                      </div>
                      <div className="space-y-6 text-left">
                        <textarea className="w-full p-10 rounded-[3rem] border-2 border-muted bg-background text-2xl focus:ring-12 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all shadow-2xl font-medium min-h-[350px] leading-relaxed tracking-tight text-foreground text-left" placeholder="Formulate technical response..." value={userAnswers[i] || ""} onChange={(e) => setUserAnswers(prev => ({ ...prev, [i]: e.target.value }))} />
                        <Button className="h-20 w-full rounded-[2rem] bg-foreground text-background text-2xl font-black uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95" onClick={() => submitAnswer(i, q.question)} disabled={!userAnswers[i] || isEvaluating[i]}>{isEvaluating[i] ? "SYNTHESIZING..." : "Execute technical Response"}</Button>
                      </div>
                      {feedbackData[i] && (
                        <div className="p-16 bg-background border-4 border-green-600/20 rounded-[4rem] shadow-3xl animate-in zoom-in-95 text-left">
                          <div className="flex justify-between items-end mb-16 border-b-2 border-muted pb-12">
                             <div>
                                <h5 className="text-xs font-black text-green-600 uppercase tracking-[0.4em] mb-4">Performance Evaluation</h5>
                                <Badge className="bg-green-600 text-7xl py-6 px-12 rounded-[2.5rem] font-black italic shadow-2xl shadow-green-500/30 border-0 text-white leading-none italic">{feedbackData[i].score}/10</Badge>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-20 mb-16 text-left">
                            <div className="text-left"><p className="text-xs font-black text-green-600 uppercase tracking-[0.3em] mb-6">Operational Strengths</p><ul className="space-y-4 font-bold text-xl text-foreground/80 leading-relaxed italic text-left">{feedbackData[i].strengths.map((s:any, idx:any)=><li key={idx} className="text-left flex items-start gap-2"><ArrowRight size={18} className="shrink-0 mt-1"/>{s}</li>)}</ul></div>
                            <div className="text-left"><p className="text-xs font-black text-red-600 uppercase tracking-[0.4em] mb-6">Architecture Gaps</p><ul className="space-y-4 font-bold text-xl text-foreground/80 leading-relaxed italic text-left">{feedbackData[i].weaknesses.map((w:any, idx:any)=><li key={idx} className="text-left flex items-start gap-2"><ArrowRight size={18} className="shrink-0 mt-1"/>{w}</li>)}</ul></div>
                          </div>
                          <div className="bg-blue-600 p-16 rounded-[4rem] shadow-3xl text-white relative overflow-hidden text-left"><p className="text-xs font-black uppercase tracking-[0.5em] mb-8 opacity-70 text-left">Senior Architecture Recommendation</p><p className="text-3xl leading-snug font-black italic opacity-95 tracking-tight text-left">"{feedbackData[i].improved_answer}"</p></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
      </Dialog>
    </div>
  );
}