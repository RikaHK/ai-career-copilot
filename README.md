## AI Career Copilot

AI Career Copilot is a full-stack application that automates the job search and preparation lifecycle. It uses Local LLMs to parse resumes, FAISS for semantic job matching, and a multi-agent system for interactive interview coaching.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, ShadCN UI.
- **Backend**: FastAPI (Python), SQLAlchemy, SQLite.
- **AI/ML**: Llama 3.1 (via Ollama), FAISS (Vector Search), Sentence-Transformers, Instructor (Structured Output).
- **Auth**: JWT-based authentication with secure cookie storage.

## Key Features
- **AI Resume Parser**: Converts unstructured PDFs into structured relational JSON data using Local LLMs.
- **Semantic Job Matcher**: Uses high-dimensional vector embeddings and FAISS to match candidates to jobs based on context, not just keywords.
- **Dynamic Learning Roadmaps**: Streams real-time markdown roadmaps using Server-Sent Events (SSE).
- **Agentic Interview Prep**: A multi-agent feedback loop that generates custom questions and evaluates user answers with a technical score and critique.
- **Persistence**: Full state recovery on page refresh via relational database integration.
- **Dark Mode**: Fully responsive, theme-aware UI.

## Getting Started

### Backend Setup
1. `cd backend`
2. `python -m venv venv`
3. `.\venv\Scripts\activate`
4. `pip install -r requirements.txt`
5. `python seed_jobs.py`
6. `uvicorn main:app --reload`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

### AI Requirements
- Install [Ollama](https://ollama.com/)
- Run `ollama run llama3.1`