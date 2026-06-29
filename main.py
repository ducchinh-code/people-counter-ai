from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "People Counter API"}

@app.get("/count")
def count():
    return {"people_count": 10}