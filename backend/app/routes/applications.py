from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi_cache.decorator import cache
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app import models, schemas
from app.dependencies import get_current_user
from app.rate_limit import limiter

router = APIRouter(prefix="/applications", tags=["applications"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=schemas.ApplicationResponse, status_code=201)
def create_application(application: schemas.ApplicationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_application = models.Application(**application.model_dump(), user_id=current_user.id)
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    return new_application


@router.get("/", response_model=List[schemas.ApplicationResponse])
@cache(expire=60)
@limiter.limit("30/minute")
async def list_applications(request: Request, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Application).filter(models.Application.user_id == current_user.id).all()


@router.get("/{application_id}", response_model=schemas.ApplicationResponse)
@cache(expire=60)
@limiter.limit("30/minute")
async def get_application(application_id: int, request: Request, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    application = db.query(models.Application).filter(models.Application.id == application_id, models.Application.user_id == current_user.id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application


@router.put("/{application_id}", response_model=schemas.ApplicationResponse)
def update_application(application_id: int, updates: schemas.ApplicationUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    application = db.query(models.Application).filter(models.Application.id == application_id, models.Application.user_id == current_user.id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(application, field, value)

    db.commit()
    db.refresh(application)
    return application


@router.delete("/{application_id}", status_code=204)
def delete_application(application_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    application = db.query(models.Application).filter(models.Application.id == application_id, models.Application.user_id == current_user.id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    db.delete(application)
    db.commit()
    return None
