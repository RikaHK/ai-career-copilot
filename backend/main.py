from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import services, matcher, json
import numpy as np
from sqlalchemy.orm import Session

import models, schemas, auth
from database import engine, get_db

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Career Copilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}
    
@app.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    content = await file.read()
    raw_text = services.extract_text_from_pdf(content)
    parsed_data = services.parse_resume_with_llm(raw_text)
    
    # Save this specific session to the history
    new_analysis = models.Analysis(
        user_id=current_user.id,
        filename=file.filename,
        resume_data=parsed_data.dict()
    )
    db.add(new_analysis)
    db.commit()
    db.refresh(new_analysis)
    
    return {"id": new_analysis.id, "parsed_data": parsed_data.dict()}

@app.get("/get-history")
async def get_history(current_user: models.User = Depends(auth.get_current_user)):
    return current_user.analyses # Returns all past uploads for this user ONLY
    
@app.post("/save-resume")
async def save_resume(
    resume_data: dict, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user) # <-- ADD THIS
):
    new_entry = models.Analysis(
        user_id=current_user.id,
        filename="Manual Save",
        resume_data=resume_data
    )
    db.add(new_entry)
    db.commit()
    return {"message": "Saved to history"}

@app.get("/get-resume")
async def get_resume(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user) # <-- ADD THIS
):
    # Fetch latest analysis for THIS user only
    latest_analysis = db.query(models.Analysis)\
        .filter(models.Analysis.user_id == current_user.id)\
        .order_by(models.Analysis.created_at.desc())\
        .first()
    
    if latest_analysis:
        return {"resume_json": latest_analysis.resume_data}
    return {"resume_json": None}

    
@app.post("/match-jobs")
async def match_jobs(resume_data: dict, db: Session = Depends(get_db)):
    # 1. Build the FAISS index with jobs from the database
    index, jobs = matcher.build_job_index(db)
    
    if not index:
        raise HTTPException(status_code=404, detail="No jobs found in database")
        
    # 2. Perform the semantic search using the data sent from Swagger/Next.js
    matches = matcher.match_resume_to_jobs(resume_data, index, jobs, top_k=3)
    
    return {"matches": matches}
    
    
@app.post("/match-custom")
async def match_custom(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    resume_data = data.get("resume_data")
    job_description = data.get("job_description")

    # Reuse your existing matching logic but for 1 specific string
    # We'll calculate the cosine similarity/distance manually using the model
    resume_text = f"Skills: {', '.join(resume_data.get('skills', []))}"
    
    # Embed both
    res_vec = matcher.model.encode([resume_text])
    job_vec = matcher.model.encode([job_description])
    
    # Calculate distance (L2)
    dist = np.linalg.norm(res_vec - job_vec)
    
    # Convert to match percentage using your existing formula
    match_percentage = max(0, min(100, int(100 - (dist * 15))))
    
    return {"match_percentage": match_percentage}


@app.post("/generate-roadmap")
async def generate_roadmap(request: Request):
    data = await request.json()
    resume_skills = data.get("resume_skills", [])
    job_title = data.get("job_title", "")
    job_requirements = data.get("job_requirements", "")

    async def roadmap_generator():
        # Use the NEW async_raw_client
        stream = await services.async_raw_client.chat.completions.create(
            model="llama3.1",
            messages=[
                {
                    "role": "system",
                    "content": "You are a career coach. Compare the user's skills to the job requirements. Identify gaps and provide a concise 4-week learning roadmap. Use Markdown."
                },
                {
                    "role": "user",
                    "content": f"User Skills: {resume_skills}\nTarget Job: {job_title}\nRequirements: {job_requirements}"
                }
            ],
            stream=True,
        )
        
        # Use 'async for' to iterate over the stream
        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield content

    return StreamingResponse(roadmap_generator(), media_type="text/plain")
    
@app.post("/generate-interview")
async def generate_interview(request: Request):
    data = await request.json()
    resume_data = data.get("resume_data")
    job_title = data.get("job_title")
    job_description = data.get("job_description")
    
    questions = services.generate_interview_questions(resume_data, job_title, job_description)
    return questions
    
@app.post("/evaluate-answer")
async def evaluate_answer(request: Request):
    data = await request.json()
    feedback = services.evaluate_interview_answer(
        question=data.get("question"),
        user_answer=data.get("user_answer"),
        job_title=data.get("job_title")
    )
    return feedback