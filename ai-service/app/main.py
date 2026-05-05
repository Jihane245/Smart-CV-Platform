from fastapi import FastAPI
from app.routes import analyze, cover_letter

app = FastAPI(title="SmartCV AI Service")

app.include_router(analyze.router)
app.include_router(cover_letter.router)

@app.get("/")
def root():
    return {"status": "AI Service running"}