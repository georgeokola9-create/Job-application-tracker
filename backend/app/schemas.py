from datetime import date
from typing import Optional

from pydantic import BaseModel


class ApplicationBase(BaseModel):
    company: str
    role: str
    status: str = "applied"
    applied_date: Optional[date] = None
    deadline: Optional[date] = None
    notes: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    pass


class Application(ApplicationBase):
    id: int

    class Config:
        from_attributes = True

