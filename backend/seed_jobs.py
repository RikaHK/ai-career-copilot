# backend/seed_jobs.py
from database import SessionLocal, engine
import models

# Ensure tables are created
models.Base.metadata.create_all(bind=engine)

dummy_jobs = [
    {
        "title": "Machine Learning Engineer",
        "company": "AI Dynamics",
        "description": "We are looking for an ML Engineer to build and optimize RAG systems and fine-tune open-source LLMs. Experience with Vector Databases is a must.",
        "requirements": "Python, PyTorch, Hugging Face, FAISS, LLMs"
    },
    {
        "title": "Backend Python Developer",
        "company": "DataFlow Systems",
        "description": "Join our infrastructure team to build highly scalable microservices. You will architect RESTful APIs and manage containerized deployments.",
        "requirements": "Python, FastAPI, Docker, PostgreSQL, AWS"
    },
    {
        "title": "Frontend React Engineer",
        "company": "Creative UI Tech",
        "description": "Looking for a UI wizard to build beautiful, responsive dashboards using modern React frameworks.",
        "requirements": "JavaScript, React, Next.js, Tailwind CSS, TypeScript"
    },
    {
        "title": "Computer Vision Specialist",
        "company": "AutoDrive Labs",
        "description": "Develop high-performance vehicle tracking systems and traffic analysis tools. Must be able to optimize algorithms for CPU-based edge devices.",
        "requirements": "C++, Python, OpenCV, CNNs, Object Detection"
    },
    {
        "title": "DevOps Engineer",
        "company": "CloudNative Corp",
        "description": "Manage our CI/CD pipelines, cloud infrastructure, and ensure 99.9% uptime for our production web sockets and chat applications.",
        "requirements": "Linux, Docker, AWS, Nginx, Git, Gunicorn"
    }
]

def seed_database():
    db = SessionLocal()
    try:
        # Check if we already have jobs so we don't duplicate them
        existing_jobs = db.query(models.Job).count()
        if existing_jobs > 0:
            print(f"Database already contains {existing_jobs} jobs. Skipping seed.")
            return

        for job_data in dummy_jobs:
            new_job = models.Job(**job_data)
            db.add(new_job)
        
        db.commit()
        print(f"Successfully seeded {len(dummy_jobs)} jobs into the database!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()