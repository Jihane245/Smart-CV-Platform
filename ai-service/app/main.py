from fastapi import FastAPI

app = FastAPI(title="Smart CV AI Service")

@app.get("/")
def health_check():
    return {"status": "AI service running"}