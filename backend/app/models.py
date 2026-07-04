from sqlalchemy import Column, Date, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from .database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String(120), nullable=False, index=True)
    role = Column(String(160), nullable=False)
    status = Column(String(40), nullable=False, default="applied", index=True)
    applied_date = Column(Date, nullable=True)
    deadline = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

