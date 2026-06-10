# backend/matcher.py
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import models

# Initialize the embedding model. 
# 'all-MiniLM-L6-v2' is incredibly fast and perfect for local dev.
print("Loading Embedding Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model Loaded!")

def build_job_index(db_session):
    """Fetches all jobs from the DB, embeds them, and builds a FAISS index."""
    jobs = db_session.query(models.Job).all()
    if not jobs:
        return None, []

    # Combine the job data into a single rich string for embedding
    job_texts = [
        f"Title: {job.title}. Description: {job.description}. Requirements: {job.requirements}" 
        for job in jobs
    ]
    
    # Convert text to vector embeddings
    embeddings = model.encode(job_texts)
    
    # Initialize FAISS Index
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension) # L2 Distance (Euclidean)
    index.add(np.array(embeddings).astype('float32'))
    
    return index, jobs

def match_resume_to_jobs(resume_data: dict, index, jobs, top_k=3):
    """Embeds the parsed resume and searches the FAISS index for best matches."""
    
    # 1. Flatten the structured resume JSON into a single dense string
    skills_str = ", ".join(resume_data.get('skills', []))
    
    exp_str = ""
    for exp in resume_data.get('experience', []):
        exp_str += f"{exp.get('title', '')} at {exp.get('company', '')}. "
        exp_str += " ".join(exp.get('responsibilities', [])) + " "
    
    resume_text = f"Candidate Skills: {skills_str}. Experience: {exp_str}"
    
    # 2. Embed the resume
    resume_vector = model.encode([resume_text])
    
    # 3. Search the FAISS index
    distances, indices = index.search(np.array(resume_vector).astype('float32'), top_k)
    
    # 4. Format the results
    matched_jobs = []
    for i, idx in enumerate(indices[0]):
        if idx != -1 and idx < len(jobs):
            job = jobs[idx]
            
            # Convert FAISS L2 distance into a simulated "Match Percentage"
            raw_distance = float(distances[0][i])
            # A completely arbitrary but nice-looking math trick to make scores look like 85%, 92%, etc.
            match_percentage = max(0, min(100, int(100 - (raw_distance * 15))))
            
            matched_jobs.append({
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "description": job.description,
                "match_percentage": match_percentage
            })
            
    # Sort by highest match percentage
    matched_jobs.sort(key=lambda x: x['match_percentage'], reverse=True)
    return matched_jobs