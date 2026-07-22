from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models import ApplicationStatus


class ApplicationBase(BaseModel):
    company_name: str
    role_title: str
    status: ApplicationStatus = ApplicationStatus.applied
    date_applied: date
    application_deadline: Optional[date] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    reference_number: Optional[str] = None
    portal_url: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[date] = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    company_name: Optional[str] = None
    role_title: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    date_applied: Optional[date] = None
    application_deadline: Optional[date] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    reference_number: Optional[str] = None
    portal_url: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[date] = None


class ApplicationResponse(ApplicationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
