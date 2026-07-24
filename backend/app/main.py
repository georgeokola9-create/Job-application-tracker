from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIASGIMiddleware
from app.database import engine, Base
from app.rate_limit import limiter
from app.routes import applications
from app.routes import auth as auth_routes

Base.metadata.create_all(bind=engine)


app = FastAPI()

# Wire up the rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Enable rate-limiting middleware (so global limits apply)
app.add_middleware(SlowAPIASGIMiddleware)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://job-application-tracker-brown-mu.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(applications.router)
app.include_router(auth_routes.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
