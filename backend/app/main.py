from fastapi import FastAPI
from app.database import engine, Base
from app.routes import applications

Base.metadata.create_all(bind=engine)


app = FastAPI()

app.include_router(applications.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
