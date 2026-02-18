"""
database.py — SQLAlchemy models and DB engine setup.
Uses SQLite (file: research_agent.db) for zero-config persistence.
"""
from datetime import datetime
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Enum,
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
import enum
DATABASE_URL = "sqlite:///./research_agent.db"
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
class SessionStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    awaiting_feedback = "awaiting_feedback"
    completed = "completed"
    failed = "failed"
class ResearchSession(Base):
    """Represents one research run initiated by the user."""
    __tablename__ = "research_sessions"
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String(500), nullable=False)
    max_analysts = Column(Integer, default=3)
    status = Column(
        Enum(SessionStatus), default=SessionStatus.pending, nullable=False
    )
    human_analyst_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    analysts = relationship(
        "AnalystRecord", back_populates="session", cascade="all, delete-orphan"
    )
    report = relationship(
        "Report", back_populates="session", uselist=False, cascade="all, delete-orphan"
    )
    def __repr__(self):
        return f"<ResearchSession id={self.id} topic='{self.topic}' status={self.status}>"
class AnalystRecord(Base):
    """Stores the AI-generated analyst personas for a session."""
    __tablename__ = "analysts"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        Integer, ForeignKey("research_sessions.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(200), nullable=False)
    role = Column(String(300), nullable=False)
    affiliation = Column(String(300), nullable=False)
    description = Column(Text, nullable=False)
    session = relationship("ResearchSession", back_populates="analysts")
    def __repr__(self):
        return f"<AnalystRecord id={self.id} name='{self.name}'>"
class Report(Base):
    """Stores the final generated research report for a session."""
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        Integer,
        ForeignKey("research_sessions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    introduction = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    conclusion = Column(Text, nullable=True)
    final_report = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("ResearchSession", back_populates="report")
    def __repr__(self):
        return f"<Report id={self.id} session_id={self.session_id}>"
def init_db():
    """Create all tables. Call once at startup."""
    Base.metadata.create_all(bind=engine)
def get_db():
    """Yield a DB session; close it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
