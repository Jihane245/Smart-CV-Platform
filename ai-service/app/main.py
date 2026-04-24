from fastapi import FastAPI
from app.routes import analyze

app = FastAPI(title="SmartCV AI Service")

app.include_router(analyze.router)

@app.get("/")
def root():
    return {"status": "AI Service running"}