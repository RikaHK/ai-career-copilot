# backend/services.py
import fitz  # PyMuPDF
from openai import OpenAI, AsyncOpenAI
import instructor
from pydantic import BaseModel, Field
from typing import List

class Experience(BaseModel):
    title: str = Field(description="Job title")
    company: str = Field(description="Company name and location")
    period: str = Field(description="Dates of employment")
    responsibilities: List[str] = Field(description="Bullet points of responsibilities")

class Education(BaseModel):
    degree: str = Field(description="Name of the degree")
    institution: str = Field(description="Name of the university/school")
    year: str = Field(description="Years attended")

class Project(BaseModel):
    # Reverted to simple descriptions so the LLM doesn't get confused
    name: str = Field(description="Name of the project")
    details: List[str] = Field(description="Bullet points describing the project")

class ResumeInfo(BaseModel):
    summary: str = Field(description="The professional summary paragraph")
    skills: List[str] = Field(description="List of all technical skills")
    experience: List[Experience]
    projects: List[Project]
    education: List[Education]
    
class InterviewQuestion(BaseModel):
    question: str = Field(description="The interview question")
    type: str = Field(description="'Technical' or 'Behavioral'")
    context: str = Field(description="Why this question is being asked based on the job/resume")

class InterviewPrep(BaseModel):
    questions: List[InterviewQuestion]
    
class AnswerFeedback(BaseModel):
    score: int = Field(description="Score from 0 to 10")
    strengths: List[str] = Field(description="What the candidate said well")
    weaknesses: List[str] = Field(description="What was missing or incorrect")
    improved_answer: str = Field(description="A professional, high-scoring version of the answer")

# 1. Create the RAW client first
raw_client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",
)

# 2. Create the WRAPPED client for JSON tasks
client = instructor.from_openai(raw_client, mode=instructor.Mode.JSON)

client = instructor.from_openai(
    OpenAI(
        base_url="http://localhost:11434/v1",
        api_key="ollama", 
    ),
    mode=instructor.Mode.JSON,
)

# 3. Add the ASYNC client for Streaming
async_raw_client = AsyncOpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",
)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def parse_resume_with_llm(text: str) -> ResumeInfo:
    resp = client.chat.completions.create(
        model="llama3.1", 
        messages=[
            {
                "role": "system", 
                "content": (
                    "You are a strict data extraction AI. "
                    "CRITICAL: Extract EVERY technical skill mentioned. "
                    "Do NOT stop after the first category. Look for categories like: "
                    "'Languages', 'AI & Machine Learning', 'Backend & Cloud', and 'DevOps & Tools'. "
                    "Extract them ALL into the 'skills' list. If there are 30 skills, list 30 skills."
                    "Do not hallucinate skills that are not mentioned."
                )
            },
            {
                "role": "user", 
                "content": f"Resume Text:\n\n{text}"
            }
        ],
        response_model=ResumeInfo,
        temperature=0.0, # <-- CRUCIAL: Stops the AI from hallucinating fake projects
        max_tokens=4000, 
        max_retries=3 
    )
    return resp
    
def generate_interview_questions(resume_data: dict, job_title: str, job_description: str) -> InterviewPrep:
    resp = client.chat.completions.create(
        model="llama3.1",
        messages=[
            {
                "role": "system",
                "content": "You are a senior technical recruiter. Generate 5 highly relevant interview questions."
            },
            {
                "role": "user",
                "content": f"Resume: {resume_data}\nJob: {job_title}\nDescription: {job_description}"
            }
        ],
        response_model=InterviewPrep,
        temperature=0.7 # Higher temperature for more varied questions
    )
    return resp
    
def evaluate_interview_answer(question: str, user_answer: str, job_title: str) -> AnswerFeedback:
    resp = client.chat.completions.create(
        model="llama3.1",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a strict technical interviewer. Evaluate the candidate's answer. "
                    "CRITICAL INSTRUCTIONS: "
                    "1. Output ONLY a populated JSON object with the actual evaluation. "
                    "2. DO NOT output a JSON schema. DO NOT include 'properties', 'type', or 'description' keys in your JSON. "
                    "3. Return ONLY the fields: 'score', 'strengths', 'weaknesses', and 'improved_answer'. "
                    "4. If the answer is short or poor, give a low score and clear weaknesses."
                )
            },
            {
                "role": "user",
                "content": f"Job Title: {job_title}\nQuestion: {question}\nCandidate Answer: {user_answer}"
            }
        ],
        response_model=AnswerFeedback,
        temperature=0.0 # Force objective, non-creative grading
    )
    return resp