// frontend/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { ModeToggle } from "@/components/mode-toggle"; // NEW: For Dark Mode
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const router = useRouter();
  
  // Hydration fix
  const [isMounted, setIsMounted] = useState(false);
  
  // State for Resume and Job Matching
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [matchedJobs, setMatchedJobs] = useState<any[]>([]);

  // State for Skill Gap & Roadmap
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [roadmapText, setRoadmapText] = useState("");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  
  // State for Interview Prep
  const [isInterviewOpen, setIsInterviewOpen] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);
  const [isGeneratingInterview, setIsGeneratingInterview] = useState(false);

  // State for Interview Feedback Loop
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({});
  const [feedbackData, setFeedbackData] = useState<{[key: number]: any}>({});
  const [isEvaluating, setIsEvaluating] = useState<{[key: number]: boolean}>({});

  // NEW: PERSISTENCE LOGIC (Load saved data on page load)
  useEffect(() => {
    setIsMounted(true);

    const loadSavedData = async () => {
      try {
        const res = await fetch("http://localhost:8000/get-resume");
        const data = await res.json();
        
        if (data.resume_json) {
          setResumeData(data.resume_json);
          
          // Automatically trigger job matching for the loaded resume
          const matchRes = await fetch("http://localhost:8000/match-jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data.resume_json),
          });
          const matchData = await matchRes.json();
          setMatchedJobs(matchData.matches);
        }
      } catch (err) {
        console.error("Failed to load saved resume", err);
      }
    };

    loadSavedData();
  }, []);

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setResumeData(null);
    setMatchedJobs([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const parseRes = await fetch("http://localhost:8000/upload-resume", {
        method: "POST",
        body: formData,
      });

      if (!parseRes.ok) throw new Error("Resume parsing failed");
      const parseData = await parseRes.json();
      const extractedData = parseData.parsed_data;
      setResumeData(extractedData);

      // NEW: PERSISTENCE LOGIC (Save after parsing)
      await fetch("http://localhost:8000/save-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(extractedData),
      });

      const matchRes = await fetch("http://localhost:8000/match-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(extractedData),
      });

      if (!matchRes.ok) throw new Error("Job matching failed");
      const matchData = await matchRes.json();
      setMatchedJobs(matchData.matches);

    } catch (error) {
      console.error(error);
      alert("An error occurred during processing.");
    } finally {
      setIsUploading(false);
    }
  };

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
      console.error(error);
    } finally {
      setIsGeneratingInterview(false);
    }
  };

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
      console.error(error);
      alert("Failed to evaluate answer.");
    } finally {
      setIsEvaluating(prev => ({ ...prev, [index]: false }));
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-background p-8 transition-colors duration-300">
      <div className="max-w-5xl mx-auto bg-card rounded-xl shadow-sm border p-8 text-left text-card-foreground">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-foreground font-mono tracking-tighter">AI Career Copilot</h1>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
        
        {/* File Upload Section */}
        <div className="mb-8 p-6 border-2 border-dashed border-muted rounded-xl bg-muted/30 flex flex-col items-center justify-center space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Upload your CV to begin</h2>
          <input 
            type="file" 
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <Button onClick={handleUpload} disabled={!file || isUploading} className="w-48 shadow-sm">
            {isUploading ? "AI is Analyzing..." : "Analyze Resume"}
          </Button>
        </div>

        {resumeData && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Professional Summary */}
            {resumeData.summary && (
              <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2 font-sans uppercase tracking-tight">Professional Summary</h3>
                <p className="text-sm leading-relaxed opacity-90">{resumeData.summary}</p>
              </div>
            )}

            {/* Matched Jobs Section */}
            {matchedJobs.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                  <span className="bg-blue-600 text-white p-1 rounded mr-3 text-sm shadow-md">🚀</span>
                  Top Job Matches for You
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {matchedJobs.map((job) => (
                    <div key={job.id} className="relative p-6 border-2 border-blue-500/20 rounded-2xl bg-gradient-to-b from-blue-500/5 to-transparent shadow-sm hover:shadow-md transition-all">
                      <div className="absolute -top-3 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        {job.match_percentage}% Match
                      </div>
                      <h4 className="font-bold text-lg text-foreground">{job.title}</h4>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-3">{job.company}</p>
                      <p className="text-xs text-muted-foreground line-clamp-3 mb-4 leading-relaxed">{job.description}</p>
                      
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full border-blue-500/30 text-blue-600 bg-transparent hover:bg-blue-500/10" onClick={() => fetchRoadmap(job)}>
                          View Gap Analysis
                        </Button>
                        <Button variant="default" size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm" onClick={() => fetchInterview(job)}>
                          Practice Interview
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold border-b pb-2 mb-4 uppercase tracking-tighter">Extracted Skills</h3>
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-sm px-3 py-1 bg-muted text-foreground border-muted-foreground/10">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold border-b pb-2 mb-4 uppercase tracking-tighter">Experience</h3>
                <div className="space-y-4">
                  {resumeData.experience.map((exp: any, i: number) => (
                    <div key={i} className="p-5 border rounded-xl bg-card shadow-sm hover:border-muted-foreground/30 transition-colors">
                      <h4 className="font-bold text-foreground">{exp.title}</h4>
                      <div className="flex justify-between items-center mt-1 mb-3">
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold">{exp.company}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">{exp.period}</span>
                      </div>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5">
                        {exp.responsibilities.map((task: string, j: number) => (
                          <li key={j} className="text-xs leading-relaxed">{task}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold border-b pb-2 mb-4 uppercase tracking-tighter">Major Projects</h3>
                <div className="space-y-4">
                  {resumeData.projects.map((proj: any, i: number) => (
                    <div key={i} className="p-5 border rounded-xl bg-card shadow-sm hover:border-muted-foreground/30 transition-colors">
                      <h4 className="font-bold text-foreground mb-3">{proj.name}</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5">
                        {proj.details.map((detail: string, j: number) => (
                          <li key={j} className="text-xs leading-relaxed">{detail}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                
                <h3 className="text-xl font-bold border-b pb-2 mt-8 mb-4 uppercase tracking-tighter">Education</h3>
                <div className="space-y-4">
                  {resumeData.education.map((edu: any, i: number) => (
                    <div key={i} className="p-4 border rounded-xl bg-muted/20 text-left">
                      <h4 className="font-bold text-foreground">{edu.degree}</h4>
                      <p className="text-sm opacity-80 mt-1">{edu.institution}</p>
                      <p className="text-xs text-muted-foreground mt-2">{edu.year}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Roadmap Dialog */}
        <Dialog open={isRoadmapOpen} onOpenChange={setIsRoadmapOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border shadow-2xl">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl font-bold">Gap Analysis: {selectedJob?.title}</DialogTitle>
              <DialogDescription className="text-blue-600 dark:text-blue-400 font-medium text-left">
                Personalized 4-week learning roadmap for {selectedJob?.company}.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 border-t pt-4 text-left">
              <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-sm dark:prose-invert prose-blue max-w-none">
                <ReactMarkdown>
                  {roadmapText || "Analyzing gaps and preparing your roadmap..."}
                </ReactMarkdown>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* INTERACTIVE Interview Prep Dialog */}
        <Dialog open={isInterviewOpen} onOpenChange={setIsInterviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border shadow-2xl">
            <DialogHeader className="text-left border-b pb-4">
              <DialogTitle className="text-2xl font-bold text-foreground">Mock Interview: {selectedJob?.title}</DialogTitle>
              <DialogDescription className="text-muted-foreground text-left">
                Answer the questions below to receive AI-powered feedback and a score.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-8 mt-6 text-left">
              {isGeneratingInterview ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4 shadow-sm"></div>
                  <p className="text-blue-600 font-medium animate-pulse">Recruiter AI is crafting custom questions...</p>
                </div>
              ) : (
                interviewQuestions.map((q, i) => (
                  <div key={i} className="p-6 border rounded-2xl bg-muted/10 border-muted shadow-sm hover:border-blue-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="outline" className="bg-card border-blue-500/30 text-blue-600 font-bold uppercase tracking-widest">
                        {q.type}
                      </Badge>
                      <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">Question {i+1}</span>
                    </div>
                    <p className="text-foreground font-bold text-xl mb-4 leading-snug">"{q.question}"</p>
                    
                    <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 mb-6">
                      <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed font-medium">
                        <span className="font-bold uppercase mr-2 opacity-60 tracking-wider">Interviewer Note:</span>
                        {q.context}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <textarea 
                        className="w-full p-5 rounded-2xl border border-muted text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-inner bg-card text-foreground"
                        placeholder="Type your response here..."
                        rows={4}
                        value={userAnswers[i] || ""}
                        onChange={(e) => setUserAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                      />
                      
                      <Button 
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 disabled:bg-muted transition-all" 
                        onClick={() => submitAnswer(i, q.question)}
                        disabled={!userAnswers[i] || isEvaluating[i]}
                      >
                        {isEvaluating[i] ? "AI is Grading Your Answer..." : "Submit Answer for Feedback"}
                      </Button>
                    </div>

                    {feedbackData[i] && (
                      <div className="mt-6 p-6 bg-card border-2 border-green-500/20 rounded-2xl animate-in zoom-in-95 duration-500 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-2">
                            <span className="bg-green-500/10 text-green-600 p-1 rounded">✅</span>
                            <span className="text-sm font-bold text-green-600 uppercase tracking-widest">AI Assessment</span>
                          </div>
                          <Badge className="bg-green-600 hover:bg-green-600 text-white text-xl py-1 px-4 rounded-lg shadow-md border-0">
                            Score: {feedbackData[i].score}/10
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/10">
                            <p className="text-xs font-bold text-green-600 uppercase mb-3 tracking-wider">Strengths</p>
                            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-2 font-medium">
                              {feedbackData[i].strengths.map((s: string, idx: number) => <li key={idx} className="leading-relaxed">{s}</li>)}
                            </ul>
                          </div>
                          
                          <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                            <p className="text-xs font-bold text-red-600 uppercase mb-3 tracking-wider">Weaknesses</p>
                            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-2 font-medium">
                              {feedbackData[i].weaknesses.map((w: string, idx: number) => <li key={idx} className="leading-relaxed">{w}</li>)}
                            </ul>
                          </div>
                        </div>

                        <div className="bg-blue-600 p-6 rounded-2xl shadow-inner text-white">
                          <p className="text-xs font-bold text-blue-100 uppercase mb-2 tracking-widest">Recommended Senior Response</p>
                          <p className="text-sm leading-relaxed font-medium italic opacity-95">"{feedbackData[i].improved_answer}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}