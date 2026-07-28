AI Career Copilot

AI Career Copilot is a high-performance, full-stack application designed to automate the technical career search and preparation lifecycle. The platform leverages Local Large Language Models (LLMs), high-dimensional vector search, and a multi-agent feedback loop to provide candidates with a comprehensive technical coaching environment.

![alt text](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)


![alt text](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)


![alt text](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)


![alt text](https://img.shields.io/badge/tailwindcss-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)


![alt text](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)


![alt text](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

Technical Stack
Frontend Architecture

    Framework: Next.js 15 (App Router)

    State Management: React Hooks with persistent cookie-based JWT handling.

    Styling: Tailwind CSS v4 with custom glassmorphism variants.

    Components: ShadCN UI and Radix UI primitives.

    Typography: React Markdown for dynamic AI-generated documentation rendering.

Backend & Machine Learning

    API Engine: Asynchronous FastAPI (Python 3.13).

    ORM: SQLAlchemy with relational schema mapping for user sessions.

    Inference Engine: Ollama hosting Llama 3.1 (8B) locally.

    Data Structuring: Pydantic and Instructor for strict JSON schema enforcement.

    Vector Search: FAISS (Facebook AI Similarity Search) using all-MiniLM-L6-v2 embeddings.

Core Features
1. Structured Resume Extraction

The system converts unstructured PDF data into a relational JSON schema. By utilizing deep-prompting techniques and high token limits, the model performs an exhaustive scan of the candidate's background, ensuring project technicalities and granular skills are preserved across page breaks.
2. Multi-Session History Tracking

Unlike standard RAG prototypes, this system implements relational persistence. Every analysis is stored in a dedicated database table linked via foreign keys to the user's account. Users can navigate, reload, and interact with previous career scans via a dedicated sidebar navigation workspace.
3. Contextual Job Discovery

The platform utilizes high-dimensional vector embeddings to perform semantic matching. Candidates are matched to job descriptions based on technical context and study relevance rather than strict keyword overlaps. The system includes an asynchronous scoring engine that calculates real-time "Match %" for manually pasted job descriptions.
4. Desktop Career Workspaces

    Gap Analysis Dashboard: A dual-column wide-screen view providing comparative technical analysis and a 4-week accelerated study roadmap streamed via Server-Sent Events (SSE).

    Technical Simulation Environment: A multi-agent workspace where a "Recruiter Agent" generates JD-specific questions and an "Evaluator Agent" provides quantitative scoring (0-10) and qualitative architectural feedback on user responses.

Getting Started
Local AI Infrastructure

The system requires an active Ollama instance.

    Install Ollama

    Pull the model: ollama run llama3.1

Backend Installation

    Navigate to the backend directory: cd backend

    Initialize virtual environment: python -m venv venv

    Activate environment: .\venv\Scripts\activate (Windows) or source venv/bin/activate (Linux)

    Install dependencies: pip install -r requirements.txt

    Seed job database: python seed_jobs.py

    Execute server: uvicorn main:app --reload

Frontend Installation

    Navigate to the frontend directory: cd frontend

    Install dependencies: npm install

    Execute development server: npm run dev

Project Structure
code Text

├── backend/
│   ├── auth.py         # JWT and cryptographic hashing logic
│   ├── main.py         # API routing and SSE stream management
│   ├── models.py       # SQLAlchemy relational models
│   ├── matcher.py      # FAISS index and embedding logic
│   └── services.py     # PDF parsing and LLM orchestration
├── frontend/
│   ├── app/
│   │   ├── dashboard/  # Interactive AI workspace
│   │   └── (auth)/     # Authentication routing groups
│   └── components/     # Reusable UI primitives and theme providers
└── README.md